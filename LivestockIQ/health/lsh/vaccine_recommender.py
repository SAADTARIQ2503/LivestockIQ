"""
LSH-based Vaccine Recommendation Service
Ported from Jupyter notebook into a reusable Django service class.

Algorithm:
  1. Character-level k-gram shingling on search_content
     (Disease Name + Vaccine Name + Animal Species + Season)
  2. SimHash with deterministic random vectors → bucket assignment
  3. At query time: find candidates in buckets within ±5 range (matches notebook)
  4. Re-rank candidates with TF-IDF cosine similarity
  5. Return top-N results
"""

import hashlib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer


class VaccineRecommender:
    """
    Singleton-style LSH recommender. Call get_instance() to get the
    shared instance so the index is built only once per server process.
    """

    _instance = None

    # LSH hyper-parameters — must match notebook exactly
    K = 3        # k-gram size
    N_BITS = 4   # number of hash bits → 2^4 = 16 buckets
    SEED_STR = "livestock_lsh_v2"

    def __init__(self):
        self.df = None
        self.vocab = {}
        self.random_vectors = None
        self.powers_of_two = None
        self.tfidf = None
        self._ready = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @classmethod
    def get_instance(cls):
        """Return the shared recommender, building the index if needed."""
        if cls._instance is None:
            cls._instance = cls()
        if not cls._instance._ready:
            cls._instance._build()
        return cls._instance

    @classmethod
    def reset(cls):
        """Force a rebuild on next call (useful after DB migrations or param changes)."""
        cls._instance = None

    def recommend(self, query: str, top_n: int = 5, min_score: float = 0.01) -> list:
        """
        Return up to top_n vaccine recommendations for a free-text query.

        Parameters
        ----------
        query     : free-text string, e.g. "foot and mouth disease cattle"
        top_n     : maximum number of results to return
        min_score : minimum cosine-similarity threshold (0–1)

        Returns
        -------
        List of dicts, each with keys:
            animal_species, disease_name, vaccine_name,
            age_at_first_dose, booster_dose, subsequent_dose,
            vaccination_season, related_information, confidence
        """
        if not self._ready:
            self._build()

        if not self._ready:
            return []

        # --- Step 1: compute query bucket ---
        query_vec = self._vectorize_query(query)
        query_sig = (query_vec @ self.random_vectors) >= 0
        query_bucket = int(query_sig.dot(self.powers_of_two)[0])

        # --- Step 2: search ±5 nearby buckets (mirrors notebook) ---
        n_buckets = 2 ** self.N_BITS
        nearby = range(max(0, int(query_bucket) - 5), min(n_buckets, int(query_bucket) + 6))
        candidates = self.df[self.df["lsh_bucket"].isin(nearby)].copy()
        candidates = candidates.drop_duplicates()

        if candidates.empty:
            return []

        # --- Step 3: TF-IDF re-ranking ---
        tfidf_matrix = self.tfidf.transform(candidates["search_content"].tolist())
        query_tfidf = self.tfidf.transform([query.lower()])
        scores = cosine_similarity(query_tfidf, tfidf_matrix).flatten()

        candidates = candidates.copy()
        candidates["score"] = scores
        candidates = candidates[candidates["score"] >= min_score]

        if candidates.empty:
            return []

        top = candidates.sort_values("score", ascending=False).head(top_n)

        return [self._row_to_dict(row) for _, row in top.iterrows()]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build(self):
        """Load dataset from DB and build the LSH index."""
        from health.models import VaccineDataset

        records = list(
            VaccineDataset.objects.values(
                "id",
                "animal_species",
                "disease_name",
                "vaccine_name",
                "age_at_first_dose",
                "booster_dose",
                "subsequent_dose",
                "vaccination_season",
                "related_information",
            )
        )

        if not records:
            return

        df = pd.DataFrame(records)

        # Build search_content (mirrors notebook: disease repeated for weight)
        df["search_content"] = (
            df["disease_name"].fillna("") + " "
            + df["disease_name"].fillna("") + " "   # weighted
            + df["vaccine_name"].fillna("") + " "
            + df["animal_species"].fillna("") + " "
            + df["vaccination_season"].fillna("")
        ).str.lower()

        df, vocab, random_vectors, powers = self._build_lsh_index(df)

        self.df = df
        self.vocab = vocab
        self.random_vectors = random_vectors
        self.powers_of_two = powers

        self.tfidf = TfidfVectorizer(stop_words="english")
        self.tfidf.fit(df["search_content"])

        self._ready = True

    def _get_kgrams(self, text: str) -> list:
        text = str(text).lower()
        k = self.K
        if len(text) < k:
            return [text]
        return [text[i: i + k] for i in range(len(text) - k + 1)]

    def _build_lsh_index(self, df: pd.DataFrame):
        """Build shingle vocab, SimHash random vectors, and bucket ids."""
        all_shingles = set()
        doc_shingles = []
        for text in df["search_content"]:
            s = self._get_kgrams(text)
            doc_shingles.append(s)
            all_shingles.update(s)

        vocab = {s: i for i, s in enumerate(sorted(all_shingles))}

        shingle_matrix = np.zeros((len(df), len(vocab)), dtype=np.float32)
        for i, shingles in enumerate(doc_shingles):
            for s in shingles:
                if s in vocab:
                    shingle_matrix[i][vocab[s]] = 1

        seed = int(hashlib.md5(self.SEED_STR.encode()).hexdigest(), 16) % (2 ** 31)
        np.random.seed(seed)
        random_vectors = np.random.choice([-1, 1], size=(shingle_matrix.shape[1], self.N_BITS))

        powers_of_two = 1 << np.arange(self.N_BITS - 1, -1, -1)
        signatures = (shingle_matrix @ random_vectors) >= 0
        bucket_ids = signatures.dot(powers_of_two)

        df = df.copy()
        df["lsh_bucket"] = bucket_ids
        return df, vocab, random_vectors, powers_of_two

    def _vectorize_query(self, query: str) -> np.ndarray:
        vec = np.zeros((1, len(self.vocab)), dtype=np.float32)
        for s in self._get_kgrams(query):
            if s in self.vocab:
                vec[0][self.vocab[s]] = 1
        return vec

    @staticmethod
    def _row_to_dict(row) -> dict:
        def clean(val):
            if pd.isna(val) or str(val).strip() in ("nan", ""):
                return None
            return str(val).strip()

        return {
            "animal_species": clean(row["animal_species"]),
            "disease_name": clean(row["disease_name"]),
            "vaccine_name": clean(row["vaccine_name"]),
            "age_at_first_dose": clean(row["age_at_first_dose"]),
            "booster_dose": clean(row["booster_dose"]),
            "subsequent_dose": clean(row["subsequent_dose"]),
            "vaccination_season": clean(row["vaccination_season"]),
            "related_information": clean(row["related_information"]),
            "confidence": round(float(row["score"]), 3),
        }
