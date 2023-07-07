import json
from .forms import NewUserForm
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from .models import Customer
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken, TokenError
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse


class RegisterView(APIView):
    @csrf_exempt
    def post(self, request):
        form = NewUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            login = LoginView()

            login_response = login.post(
                request, password=request.POST["password1"], email=request.POST["email"]
            )
            content = json.loads(login_response.content)
            access_token = content["access_token"]
            refresh_token = content["refresh_token"]
            return HttpResponse(
                json.dumps(
                    {"access_token": access_token, "refresh_token": refresh_token}
                ),
                status=status.HTTP_201_CREATED,
            )
        else:
            print(form.errors)
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    @csrf_exempt
    def post(self, request, **kwargs):
        if "password" not in kwargs.keys() and "email" not in kwargs.keys():
            email = request.data["email"]
            password = request.data["password"]
        else:
            email = kwargs["email"]
            password = kwargs["password"]
        try:
            user = Customer.objects.get(email=email)
        except Customer.DoesNotExist:
            raise AuthenticationFailed("Account does not exist")
        if user is None:
            raise AuthenticationFailed("Customer does not exist")
        if not user.check_password(password):
            raise AuthenticationFailed("Incorrect Password")
        access_token = str(AccessToken.for_user(user))
        refresh_token = str(RefreshToken.for_user(user))
        return HttpResponse(
            json.dumps({"access_token": access_token, "refresh_token": refresh_token}),
            status=200,
        )


class LogoutView(APIView):
    @csrf_exempt
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response("Logout Successful", status=status.HTTP_200_OK)
        except TokenError:
            raise AuthenticationFailed("Invalid Token")


class CustomerView(APIView):
    @csrf_exempt
    def get(self, request):
        try:
            access_token = request.headers.get("Authorization").split(" ")[1]
            token = AccessToken(access_token)
            user_id = token["user_id"]
            return Response({"customer_id": user_id}, status=status.HTTP_200_OK)
        except TokenError:
            raise AuthenticationFailed("Invalid token")
        except Customer.DoesNotExist:
            raise AuthenticationFailed("Customer does not exist")
