from __future__ import annotations

from django.urls import path

from .views import health_view, meta_view, rank_view

urlpatterns = [
    path("health", health_view),
    path("meta", meta_view),
    path("rank", rank_view),
]
