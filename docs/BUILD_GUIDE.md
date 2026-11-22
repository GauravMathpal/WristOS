# WristOS Firmware — Build Guide

## 1. Overview
The WristOS firmware is built using **CMake**, **ARM GNU Embedded Toolchain (`arm-none-eabi-gcc`)**, and the **Nordic nRF52 SDK 15.3.0**.

For absolute reproducibility and zero host toolchain conflicts, the **Docker-based build environment** is the primary supported build path. A native macOS toolchain option is also documented.

---

## 2. Docker / Colima Build (Recommended)

### Prerequisites on macOS (Apple Silicon)
1. Docker CLI or Colima installed (`brew install docker colima`).
2. Start the container engine:
   ```bash
   colima start --cpu 4 --memory 6
   ```

### Step 1: Build the Docker Builder Image
The official InfiniTime Docker environment includes the exact compiler (`arm-none-eabi-gcc 15.3.rel1`), nRF5 SDK, and MCUBoot `imgtool`.

```bash
cd firmware
docker build -t pinetime-build -f docker/Dockerfile docker/
```

### Step 2: Compile the Firmware
Run the container mounting the `firmware/` directory to `/sources`:

```bash
docker run --rm -v "$(pwd):/sources" pinetime-build
```

### Outputs Generated:
The build artifacts will be placed in `firmware/build/src/`:
- `pinetime-app.out` — ELF binary with debug symbols.
- `pinetime-app.bin` — Raw application binary.
- `pinetime-mcuboot-app.bin` — MCUBoot-compatible image header + payload.
- `pinetime-mcuboot-app-dfu.zip` — OTA DFU package ready for wireless upload.

---

## 3. Native macOS Build (Advanced)

### Prerequisites:
```bash
brew install cmake ninja arm-none-eabi-gcc nodejs python3
pip3 install adafruit-nrfutil cbor cryptography==3.3
npm install -g lv_font_conv@1.5.2
```

### Downloading nRF5 SDK 15.3.0:
```bash
mkdir -p /opt/tools
cd /opt/tools
curl -O https://nsscprodmedia.blob.core.windows.net/prod/software-and-other-downloads/sdks/nrf5/binaries/nRF5_SDK_15.3.0_59ac345.zip
unzip -q nRF5_SDK_15.3.0_59ac345.zip
```

### Configuring & Compiling:
```bash
cd firmware
mkdir -p build && cd build
cmake -G Ninja \
  -DARM_NONE_EABI_TOOLCHAIN_PATH=$(dirname $(dirname $(which arm-none-eabi-gcc))) \
  -DNRF5_SDK_PATH=/opt/tools/nRF5_SDK_15.3.0_59ac345 \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_DFU=1 \
  ..
ninja pinetime-mcuboot-app
```

---

## 4. InfiniSim Native Simulator Setup

**InfiniSim** simulates the PineTime hardware natively on macOS using SDL2. This is the **primary development loop** for WristOS watch faces, UI widgets, and navigation before touching any physical hardware.

### Clone InfiniSim:
```bash
cd /Users/gauravm/Projects/WristOS
git clone --recursive https://github.com/InfiniTimeOrg/InfiniSim.git simulator
```

### Build & Run Simulator:
```bash
brew install sdl2
cd simulator
cmake -B build -S .
cmake --build build -j$(sysctl -n hw.ncpu)
./build/infinisim
```
