# Tasker Permissions Module

Tasker Permissions Module is an advanced module built for Shizuku forks that implement the ADB Modules feature, such as [**Shevery**](https://github.com/HmnDev-Tech/shevery) or [**Nightzuku**](https://github.com/kerneldroid/Nightzuku). Its primary purpose is to bypass the need for a PC connection by providing on-device management of hidden, restricted, and advanced Android permissions (`WRITE_SECURE_SETTINGS`, `DUMP`, etc.) strictly for applications within the **Tasker automation ecosystem**.


## Components

The module consists of two main execution layers:

1. **`action.sh` (Quick shell action):** This script automatically scans the device to detect which of the supported applications are installed, and silently grants all their required advanced permissions in bulk via standard ADB commands.
2. **WebUI (Frontend):** A fully local HTML/JS interface that runs inside the manager's embedded WebView. It communicates directly with the underlying Shizuku service, allowing complex command execution and permission managing(`pm list packages`, `dumpsys package`, `pm grant`) without relying on a terminal emulator.


## Core Features

* **Native Shizuku Bridge:** Interacts directly with the Android system via the local Javascript-to-Shell API, securely dispatching required `pm` and `dumpsys` commands straight from the WebView.
* **Real-Time State Polling:** The WebUI dynamically executes and parses system dump data (`dumpsys package`) to evaluate the exact granted or revoked status of each permission. This ensures the interface displays the actual, real-time system state rather than relying on cached or assumed data.
* **Granular and Batch Execution:** Provides filtering and a categorized interface to toggle specific permissions on a per-app basis, alongside global execution macros to safely grant or revoke all permissions across valid installed packages simultaneously.
* **Strict Local Environment:** This module doesn't need an internet connection at all. It's built entirely on native ES6 modules with zero external network dependencies.


## Supported Applications

The target scope of this module is explicitly limited to the following Tasker related applications:

| Application | Package Name |
|-------------|--------------|
| [**Tasker**](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm) | `net.dinglisch.android.taskerm` |
| [**App Manager NG**](https://github.com/SysAdminDoc/AppManagerNG) | `io.github.sysadmindoc.AppManagerNG` |
| [**AutoInput**](https://play.google.com/store/apps/details?id=com.joaomgcd.autoinput) | `com.joaomgcd.autoinput` |
| [**AutoTools**](https://play.google.com/store/apps/details?id=com.joaomgcd.autotools) | `com.joaomgcd.autotools` |
| [**AutoWear**](https://play.google.com/store/apps/details?id=com.joaomgcd.autowear) | `com.joaomgcd.autowear` |
| [**Fluid Navigation Gestures**](https://www.apkmirror.com/apk/francisco-barroso/fluid-navigation-gestures/) | `com.fb.fluid` |
| [**Greenify**](https://play.google.com/store/apps/details?id=com.oasisfeng.greenify) | `com.oasisfeng.greenify` |
| [**Join**](https://play.google.com/store/apps/details?id=com.joaomgcd.join) | `com.joaomgcd.join` |
| [**Nightzuku**](https://github.com/kerneldroid/Nightzuku) | `com.nightzuku.app` |
| [**SecondScreen**](https://play.google.com/store/apps/details?id=com.farmerbb.secondscreen.free) | `com.farmerbb.secondscreen.free` |
| [**Secure Settings**](https://www.apkmirror.com/apk/intangibleobject/secure-settings/) | `com.intangibleobject.securesettings.plugin` |
| [**SecureTask**](https://play.google.com/store/apps/details?id=com.balda.securetask) | `com.balda.securetask` |
| [**Shevery**](https://github.com/HmnDev-Tech/shevery) | `com.hamondev.shevery` |
| [**SystemUI Tuner**](https://play.google.com/store/apps/details?id=com.zacharee1.systemuituner) | `com.github.zacharee.systemuituner` |
| [**Tasker Settings**](https://github.com/joaomgcd/TaskerSettings) | `net.dinglisch.android.taskersettings` |
| [**Termux**](https://github.com/termux/termux-app) | `com.termux` |
| [**Termux:API**](https://github.com/termux/termux-api) | `com.termux.api` |


## Prerequisites

* A compatible Shizuku fork with support for **ADB Modules**.
* **Shizuku service** properly running on the device.


## Installation

- ### Using In-App Manager

Modern Shizuku forks feature built-in GitHub module browsers:
1. Open the ADB Modules manager within your app.
2. Use the built-in GitHub search feature to look for this repository. You may need enter a GitHub Personal Access Token (PAT) to search for modules.
3. Locate this module and click on install. Manager will automatically handle the download and installation process.

- ### Using manual installation

1. Download the latest `tasker-permissions.zip` from the GitHub Releases page.
2. Open your Shizuku module manager.
3. Import and install the `.zip` file using the local file picker.

## Before using

Regardless of the installation method used, it is required to apply the following security policy:
1. Locate the installed module card in your manager.
2. Long-press it and grant **Full Trust / Full Access**. This is strictly required by the ADB Modules API to expose the `window.Shizuku` object and permit background shell execution.
3. You can now tap the module card to launch the WebUI, or trigger `action.sh` directly from the manager's UI.


## Build Instructions

1. Clone the repository.
2. Ensure the directory structure adheres to the ADB Modules API specification (with `module.prop`, `action.sh`, and `webui/` at the root).
3. Run the included `build.sh` script to generate a compliant `.zip` package.


## Contributing

Pull requests are highly appreciated. Whether you are looking to improve the core execution logic, fix bugs, or add support for new applications, your contributions are welcome.

If proposing new apps, please ensure they align with the project's focus on automation and advanced system tweaking.


## License

This project is open-source and distributed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENCE](LICENSE) file for more information.