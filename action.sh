#!/system/bin/sh


# ===================================================================


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
    android.permission.SET_VOLUME_KEY_LONG_PRESS_LISTENER
";
grant_package_permissions "$TASKER_PKG" $TASKER_PERMS;

# Tasker Settings
TASKER_SETTINGS_PKG="com.joaomgcd.taskersettings";
TASKER_SETTINGS_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$TASKER_SETTINGS_PKG" $TASKER_SETTINGS_PERMS;

# Autotools
AUTOTOOLS_PKG="com.joaomgcd.autotools";
AUTOTOOLS_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
    android.permission.DUMP
    android.permission.READ_LOGS
    android.permission.CHANGE_CONFIGURATION
";
grant_package_permissions "$AUTOTOOLS_PKG" $AUTOTOOLS_PERMS;

# Autoinput
AUTOINPUT_PKG="com.joaomgcd.autoinput";
AUTOINPUT_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$AUTOINPUT_PKG" $AUTOINPUT_PERMS;

# Autowear
AUTOWEAR_PKG="com.joaomgcd.autowear";
AUTOWEAR_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$AUTOWEAR_PKG" $AUTOWEAR_PERMS;

# Join by joaomgcd
JOIN_PKG="com.joaomgcd.join";
JOIN_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
    android.permission.READ_LOGS
";
grant_package_permissions "$JOIN_PKG" $JOIN_PERMS;

# SecureTask
SECURETASK_PKG="com.balda.securetask";
SECURETASK_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
    android.permission.DUMP
    android.permission.READ_LOGS
    android.permission.CHANGE_CONFIGURATION
";
grant_package_permissions "$SECURETASK_PKG" $SECURETASK_PERMS;

# Secure Settings
SECURE_SETTINGS_PKG="com.intangibleobject.securesettings.plugin";
SECURE_SETTINGS_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
    android.permission.READ_LOGS
    android.permission.CHANGE_CONFIGURATION
";
grant_package_permissions "$SECURE_SETTINGS_PKG" $SECURE_SETTINGS_PERMS;

# Greenify
GREENIFY_PKG="com.oasisfeng.greenify";
GREENIFY_PERMS="
    android.permission.DUMP
    android.permission.READ_LOGS
    android.permission.GET_APP_OPS_STATS
    android.permission.INTERACT_ACROSS_USERS
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$GREENIFY_PKG" $GREENIFY_PERMS;

# SystemUI Tuner
SYSTEMUI_TUNER_PKG="com.zacharee1.systemuituner";
SYSTEMUI_TUNER_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
    android.permission.DUMP
";
grant_package_permissions "$SYSTEMUI_TUNER_PKG" $SYSTEMUI_TUNER_PERMS;

# Fluid Navigation Gestures
FLUID_PKG="com.fb.fluid";
FLUID_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$FLUID_PKG" $FLUID_PERMS;

# Termux
TERMUX_PKG="com.termux";
TERMUX_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
    android.permission.DUMP
    android.permission.READ_LOGS
";
grant_package_permissions "$TERMUX_PKG" $TERMUX_PERMS;

# Termux:API
TERMUX_API_PKG="com.termux.api";
TERMUX_API_PERMS="
    android.permission.DUMP
";
grant_package_permissions "$TERMUX_API_PKG" $TERMUX_API_PERMS;

# SecondScreen
SECONDSCREEN_PKG="com.farmerbb.secondscreen.free";
SECONDSCREEN_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$SECONDSCREEN_PKG" $SECONDSCREEN_PERMS;

# AppManagerNG
APPMANAGERNG_PKG="io.github.sysadmindoc.AppManagerNG";
APPMANAGERNG_PERMS="
    android.permission.DUMP
    android.permission.GET_APP_OPS_STATS
    android.permission.INTERACT_ACROSS_USERS
    android.permission.READ_LOGS
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$APPMANAGERNG_PKG" $APPMANAGERNG_PERMS;

# Shevery
SHEVERY_PKG="com.hamondev.shevery";
SHEVERY_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$SHEVERY_PKG" $SHEVERY_PERMS;

# Nightzuku
NIGHTZUKU_PKG="kerneldroid.nightzuku";
NIGHTZUKU_PERMS="
    android.permission.WRITE_SECURE_SETTINGS
";
grant_package_permissions "$NIGHTZUKU_PKG" $NIGHTZUKU_PERMS;


# ===================================================================


echo "Finished!";