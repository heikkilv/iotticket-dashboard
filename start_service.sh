#!/bin/bash

# Copyright (c) Tampere University 2019.
# This software has been developed in ProCemPlus-project funded by Business Finland.
# This code is licensed under the MIT license.
# See the LICENSE.txt in the project root for the license terms.
#
# Main author(s): Ville Heikkila

docker volume create --name=iotticket_data
docker volume create --name=iotticket_screenshots
docker volume create --name=dashboard_html

docker build --tag dashboard_creator:1.0 ./dashboard_creator
docker build --tag iotticket:1.0 ./screenshot

source update_locations.sh

docker-compose up --detach
