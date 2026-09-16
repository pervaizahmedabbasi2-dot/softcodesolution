#!/bin/bash
# Remove the extraneous closing </main>
sed -i '464s/<\/main>//g' frontend/src/app/dashboard/dashboard.component.html
