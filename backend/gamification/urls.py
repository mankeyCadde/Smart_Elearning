from django.urls import path

from . import views

app_name = "gamification"

urlpatterns = [
    path("gamification/me/", views.GamificationMeView.as_view(), name="gamification-me"),
    path("gamification/badges/", views.BadgeListView.as_view(), name="gamification-badges"),
    path("gamification/leaderboard/", views.LeaderboardView.as_view(), name="gamification-leaderboard"),
]