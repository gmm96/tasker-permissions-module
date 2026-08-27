#!/system/bin/sh

grant_package_permissions()
{
    package_id="$1";
    shift;
    package_permissions="$@";

    if pm list packages | grep -q "package:$package_id";
    then
        echo "Package detected: $package_id. Applying config...";
        
        for permission in $package_permissions;
        do
            if pm grant "$package_id" "$permission" > /dev/null 2>&1;
            then
                echo "  -> Granted: $permission";
            else
                echo "  -> FAILED: $permission";
            fi
        done
    else
        echo "Package NOT installed: $package_id. Skipping.";
    fi
    echo "-----------------------------------------";
}


# ===================================================================


echo "================================"
echo "   Tasker Permissions Module    "
echo "================================"

# Tasker
TASKER_PKG="net.dinglisch.android.taskerm";
TASKER_PERMS="
android.permission.WRITE_SECURE_SETTINGS
android.permission.DUMP
android.permission.READ_LOGS
android.permission.CHANGE_CONFIGURATION
android.permission.PACKAGE_USAGE_STATS
android.permission.SYSTEM_ALERT_WINDOW
android.permission.SET_VOLUME_KEY_LONG_PRESS_LISTENER
android.permission.SET_MEDIA_KEY_LISTENER
";
grant_package_permissions "$TASKER_PKG" $TASKER_PERMS;

# Tasker Settings
TASKER_SETTINGS_PKG="com.joaomgcd.taskersettings";
TASKER_SETTINGS_PERMS="android.permission.WRITE_SECURE_SETTINGS";
grant_package_permissions "$TASKER_SETTINGS_PKG" $TASKER_SETTINGS_PERMS;

# Autotools
AUTOTOOLS_PKG="com.joaomgcd.autotools";
AUTOTOOLS_PERMS="android.permission.WRITE_SECURE_SETTINGS";
grant_package_permissions "$AUTOTOOLS_PKG" $AUTOTOOLS_PERMS;

# Autoinput
AUTOINPUT_PKG="com.joaomgcd.autoinput";
AUTOINPUT_PERMS="android.permission.WRITE_SECURE_SETTINGS";
grant_package_permissions "$AUTOINPUT_PKG" $AUTOINPUT_PERMS;

# Autowear
AUTOWEAR_PKG="com.joaomgcd.autowear";
AUTOWEAR_PERMS="android.permission.WRITE_SECURE_SETTINGS";
grant_package_permissions "$AUTOWEAR_PKG" $AUTOWEAR_PERMS;

# Join by joaomgcd
JOIN_PKG="com.joaomgcd.join";
JOIN_PERMS="
    android.permission.READ_LOGS
    android.permission.SYSTEM_ALERT_WINDOW
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$JOIN_PKG" $JOIN_PERMS;


# ===================================================================


echo "Finished!";
