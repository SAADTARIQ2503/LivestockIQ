from rest_framework import serializers
from farms.models import Farm


class FarmSerializer(serializers.ModelSerializer):
    animal_count = serializers.SerializerMethodField()

    class Meta:
        model = Farm
        fields = ('id', 'name', 'address', 'latitude', 'longitude',
                  'animal_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_animal_count(self, obj):
        return obj.animals.count()


class FarmCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ('id', 'name', 'address', 'latitude', 'longitude')
        read_only_fields = ('id',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
