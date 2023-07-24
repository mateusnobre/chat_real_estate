from django.urls import path
from . import views

urlpatterns = [
    path("query-index/", views.query_index, name="query_index"),
    path("upload-file/", views.upload_file, name="upload_file"),
    path("get-documents/", views.get_documents, name="get_documents"),
    path("indexes/", views.index_list, name="index_list"),
    path("indexes/create/", views.index_create, name="index_create"),
    path("indexes/delete/<int:pk>/", views.index_delete, name="index_delete"),
    path(
        "indexes/by-user-id/",
        views.get_indexes_by_user,
        name="indexes_by_user",
    ),
    path(
        "indexes/by-id/<int:pk>/",
        views.get_index_by_id,
        name="index_by_id",
    ),
]
