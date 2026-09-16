#!/bin/bash
# Remove the extraneous closing </header> and add proper div closures
sed -i '137s/<\/header>//g' frontend/src/app/dashboard/dashboard.component.html
