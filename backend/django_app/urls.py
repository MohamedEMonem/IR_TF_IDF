from django.urls import path
from .views import (
    health_view, 
    meta_view, 
    rank_view, 
    upload_view, 
    document_view, 
    status_view
)

urlpatterns = [
    # General Endpoints
    path('health', health_view, name='health'),
    path('status', status_view, name='status'),
    path('meta', meta_view, name='meta'),
    
    # Core Functionality
    path('upload', upload_view, name='upload'),
    path('rank', rank_view, name='rank'),
    path('document/<int:doc_id>', document_view, name='document'), 
]