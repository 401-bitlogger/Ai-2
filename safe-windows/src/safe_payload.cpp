#define WIN32_LEAN_AND_MEAN
#include <windows.h>

extern "C" __declspec(dllexport) const wchar_t* WINAPI SafeBuildInfo() noexcept {
    return L"sdgii23dmkf-safe: network-free self-test payload";
}

extern "C" __declspec(dllexport) BOOL WINAPI RunSelfTest() noexcept {
    return TRUE;
}

BOOL WINAPI DllMain(HINSTANCE instance, DWORD reason, LPVOID) {
    if (reason == DLL_PROCESS_ATTACH) {
        DisableThreadLibraryCalls(instance);
    }
    return TRUE;
}
