#!/bin/bash
sed -i 's/CheckCircle \|\|/CheckCircle2 \|\|/g' frontend/src/app/dashboard/license/license.component.html
sed -i 's/icons.CheckCircle/icons.CheckCircle2/g' frontend/src/app/dashboard/license/license.component.html
sed -i 's/Eye, Pin, EyeOff,/Eye, Pin, EyeOff, Copy, MoreVertical,/g' frontend/src/app/dashboard/dashboard.component.ts
