from django.urls import path

from .views import health_view, meta_view, rank_view, upload_view, document_view, status_view

urlpatterns = [
    path('health', health_view),
    path('meta', meta_view),
    path('rank', rank_view),
    path('upload', upload_view),
    path('document/<int:doc_id>', document_view, name='document_view'),
    path('status', status_view), 
]