#!/bin/bash

# Replace the following values with your own:
PROJECT_ID="web-scraping-real-estate"
IMAGE_NAME="chat_real_estate"
MACHINE_TYPE="e2-small"
ZONE="us-south1-a"
INSTANCE_NAME="chat-real-estate"

# Build the Docker image
docker build -t $IMAGE_NAME .

# Authenticate Docker to push to GCR
gcloud auth configure-docker

# Push the Docker image to GCR
docker tag $IMAGE_NAME gcr.io/$PROJECT_ID/$IMAGE_NAME
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME

# Start a new Compute Engine instance
gcloud compute instances create $INSTANCE_NAME \
  --project=$PROJECT_ID \
  --zone=$ZONE \
  --image-project=ubuntu-os-cloud \
  --image-family=ubuntu-2004-lts \
  --machine-type=$MACHINE_TYPE \
  --metadata startup-script='#!/bin/bash
  sudo apt-get update
  sudo apt-get install -y docker.io
  sudo docker pull gcr.io/'$PROJECT_ID'/'$IMAGE_NAME'
  sudo docker run -d -p 80:8080 gcr.io/'$PROJECT_ID'/'$IMAGE_NAME''

# Get the IP address of the Compute Engine instance
IP_ADDRESS=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# Print the IP address of the Compute Engine instance
echo "The application is now available at: http://$IP_ADDRESS"
