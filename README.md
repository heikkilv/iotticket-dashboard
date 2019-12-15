# Proxy server for sharing screenshots from IoT-Ticket dashboards

This service is made so that a Wapice IoT-Ticket dashboard can be shown to the user without the requiring access credentials to the dashboard service. The proper credentials will still be required by the administrator who sets up this service.

The service starts a headless Chrome browser with all the given dashboard urls as opened in separate tabs. Periodic screenshots are then taken from each of the dashboards and these screenshots are then served using Nginx proxy server. The browser is restarted periodically in order to avoid session timeout.

## Requirements

- docker (18.09.1 or above)
- docker-compose (1.23.2 or above)

Older version might work but have not been tested.

## Starting the service

- Rename `dashboard_names_template.txt` to `dashboard_names.txt` and edit in the names of the dashboards.
- Rename `dashboard_urls_template` to `dashboard_urls.txt` and edit in the urls of the dashboards.
- Rename `settings_template.env` to `settings.env` and modify the settings as needed.
- Rename `secrets_template.env` to `secrets.env` and edit in the access credentials for the IoT-Ticket dashboards.
- Run the start_service script.

  ```bash
  source start_service.sh
  ```

- The list of the dashboards and links to the individual dashboards will be available at the address: `http://<host><root-path>/`. The direct links to the dashboards will be:
    - `http://<host><root-path>/1/`
    - `http://<host><root-path>/2/`
    - ...

## Ending the service

Run the stop_service script.

```bash
source stop_service.sh
```

## License

This service has been done for the [ProCemPlus project](https://www.senecc.fi/projects/procemplus) at Tampere University and it is licensed under [MIT license](LICENSE.txt).
