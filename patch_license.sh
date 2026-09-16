#!/bin/bash
sed -i "s/icons\.|| 'check-circle'/icons.CheckCircle2 || 'check-circle'/g" frontend/src/app/dashboard/license/license.component.html
