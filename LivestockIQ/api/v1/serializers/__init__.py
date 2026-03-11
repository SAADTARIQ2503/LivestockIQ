from .auth import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer
)
from .animals import (
    AnimalSerializer,
    AnimalListSerializer,
    AnimalCreateSerializer,
    VaccineBySpeciesSerializer,
    AnimalStatisticsSerializer
)
from .health import (
    VaccinationScheduleSerializer,
    VaccinationScheduleCreateSerializer,
    VaccineDatasetSerializer
)
from .farms import FarmSerializer, FarmCreateSerializer
from .mortality import MortalityRecordSerializer, MortalityRecordCreateSerializer