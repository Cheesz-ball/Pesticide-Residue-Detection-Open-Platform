from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # 用于临时禁用CSRF，API通常用Token
import json
from django.db import IntegrityError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.contrib.auth.models import User


@csrf_exempt  # 对于基于token的API，可以豁免CSRF，因为token本身提供了保护
@api_view(["POST"])
@permission_classes([AllowAny])  # 允许任何人访问此视图
def login_view(request):
    if request.method == "POST":
        try:
            # 前端发送的是 JSON 数据
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not username or not password:
            return JsonResponse(
                {"error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 使用 Django 的 authenticate
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Django 的 login() 方法会创建 session，即使我们主要用 token，这也是个好习惯
            login(request, user)

            # 生成 JWT Tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return JsonResponse(
                {
                    "message": "Login successful!",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user": {  # 可以选择性地返回一些用户信息
                        "username": user.username,
                        "email": user.email,
                        # 'first_name': user.first_name,
                        # 'last_name': user.last_name,
                    },
                },
                status=status.HTTP_200_OK,
            )
        else:
            return JsonResponse(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        return JsonResponse(
            {"error": "Only POST method is allowed"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


@api_view(["POST"])
# @permission_classes([IsAuthenticated]) # 确保只有登录用户才能登出，但登出通常不需要严格的token验证
def logout_view(request):
    # 如果你使用了 Simple JWT 的黑名单功能，可以在这里将 token 加入黑名单
    # from rest_framework_simplejwt.tokens import RefreshToken
    # try:
    #     refresh_token = request.data["refresh"]
    #     token = RefreshToken(refresh_token)
    #     token.blacklist()
    # except Exception as e:
    #     return JsonResponse({'error': 'Invalid refresh token or already blacklisted'}, status=status.HTTP_400_BAD_REQUEST)

    logout(request)  # 清除 Django session
    return JsonResponse({"message": "Logout successful!"}, status=status.HTTP_200_OK)


csrf_exempt


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            email = data.get("email")
            password = data.get("password")
            password2 = data.get("password2")  # For confirmation

            # Basic Validation
            if not all([username, email, password, password2]):
                return JsonResponse(
                    {"error": "All fields are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if password != password2:
                return JsonResponse(
                    {"error": "Passwords do not match."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # More specific password validation (e.g., length) can be added here
            if len(password) < 8:  # Example: minimum 8 characters
                return JsonResponse(
                    {"error": "Password must be at least 8 characters long."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Attempt to create user
            try:
                # User.objects.create_user will hash the password automatically
                user = User.objects.create_user(
                    username=username, email=email, password=password
                )
                # You can add more user details here if needed, e.g., user.first_name = ...

                # Optional: Log the user in immediately after registration
                # refresh = RefreshToken.for_user(user)
                # access_token = str(refresh.access_token)
                # refresh_token = str(refresh)
                # login(request, user) # Optional: if you want to set a Django session too

                return JsonResponse(
                    {
                        "message": "Registration successful! You can now log in.",
                        # 'access_token': access_token, # Uncomment if auto-login
                        # 'refresh_token': refresh_token, # Uncomment if auto-login
                        # 'user': {'username': user.username, 'email': user.email} # Uncomment if auto-login
                    },
                    status=status.HTTP_201_CREATED,
                )

            except IntegrityError as e:
                # This usually means username or email already exists
                if "username" in str(e).lower():
                    return JsonResponse(
                        {"error": "Username already exists."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                elif (
                    "email" in str(e).lower()
                ):  # Note: Default User model doesn't enforce email uniqueness at DB level without custom model.
                    # Django forms and DRF serializers do this validation.
                    # For a more robust check: User.objects.filter(email=email).exists()
                    if User.objects.filter(email=email).exists():
                        return JsonResponse(
                            {"error": "Email already exists."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    else:  # Other integrity error
                        return JsonResponse(
                            {
                                "error": "An error occurred during registration. Please try again."
                            },
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        )

            except Exception as e:
                # Catch any other unexpected errors
                return JsonResponse(
                    {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON data."}, status=status.HTTP_400_BAD_REQUEST
            )
    else:
        return JsonResponse(
            {"error": "Only POST method is allowed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
