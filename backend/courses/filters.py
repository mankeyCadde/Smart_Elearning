import django_filters

from .models import Course


class CourseFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category__id")
    level = django_filters.CharFilter(field_name="level")
    minPrice = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    maxPrice = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Course
        fields = ["category", "level"]