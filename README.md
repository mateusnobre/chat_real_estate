# Chat-Real-Estate

What you need
- postgres database
- credentials for .envs (OpenAI API, GCP, Stripe and postgres DB)
- python + poetry
- npm + next


Run frontend:
- cd frontend
- npm i
- npm run dev

Run backend:
- cd backend
- poetry init
- poetry shell
- python3 manage.py makemigrations
- python3 manage.py migrate
- python3 manage.py runserver


Run postgres on docker:
- sudo docker pull postgres
- sudo docker run --name pgsql-dev -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres 


Running with docker:
- docker build -t chat-real-estate .
- docker run -p 8000:8000 chat-real-estate
