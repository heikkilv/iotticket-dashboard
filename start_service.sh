docker volume create --name=iotticket_data
docker volume create --name=iotticket_screenshots
docker volume create --name=dashboard_html
docker build --tag dashboard_creator:1.0 ./dashboard_creator
docker build --tag iotticket:1.0 ./screenshot
docker-compose up --detach
