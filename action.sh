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
    echo "-----------------------------------------"
}


echo "========================="
echo "   Tasker Permissions    "
echo "========================="

# NOTE: these lists must stay identical to the "permissions" arrays in
# webui/apps.js. The shell can't import the .js file directly, so any
# change here has to be mirrored there by hand (and vice versa), or the
# WebUI will show a different grant status than what this script actually
# applies.

# Tasker
TASKER_PKG="net.dinglisch.android.taskerm";
TASKER_PERMS="
android.permission.WRITE_SECURE_SETTINGS
android.permission.DUMP
android.permission.READ_LOGS
android.permission.CHANGE_CONFIGURATION
android.permission.PACKAGE_USAGE_STATS
";
grant_package_permissions "$TASKER_PKG" $TASKER_PERMS;

# Tasker Settings
# Only WRITE_SECURE_SETTINGS is documented as needed by this app
# (see https://github.com/joaomgcd/Tasker-Permissions).
SETTINGS_PKG="com.joaomgcd.taskersettings";
SETTINGS_PERMS="
android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$SETTINGS_PKG" $SETTINGS_PERMS;

# =================================================================

echo "Finished!";
