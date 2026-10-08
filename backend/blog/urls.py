from django.urls import path

from . import views

urlpatterns = [
    path("api/v1/posts/", views.post_list, name="post-list"),
]
