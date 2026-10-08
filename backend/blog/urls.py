from django.urls import path

from . import views

urlpatterns = [
    path("api/v1/posts/", views.post_list, name="post-list"),
    path("api/v1/auth/me/", views.auth_me, name="auth-me"),
    path("api/v1/auth/login/", views.auth_login, name="auth-login"),
    path("api/v1/auth/logout/", views.auth_logout, name="auth-logout"),
    path("api/v1/auth/account/", views.account_update, name="auth-account"),
    path("api/v1/admin/posts/", views.post_create, name="post-create"),
]
