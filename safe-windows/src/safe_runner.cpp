#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <filesystem>
#include <iostream>
#include <string>

namespace {
using SafeBuildInfoFn = const wchar_t* (WINAPI*)();
using RunSelfTestFn = BOOL (WINAPI*)();

std::filesystem::path executable_directory() {
    std::wstring buffer(32768, L'\0');
    const DWORD length = GetModuleFileNameW(nullptr, buffer.data(),
                                            static_cast<DWORD>(buffer.size()));
    if (length == 0 || length >= buffer.size()) {
        throw std::runtime_error("GetModuleFileNameW failed");
    }
    buffer.resize(length);
    return std::filesystem::path(buffer).parent_path();
}
}

int wmain() {
    try {
        const auto dll_path =
            executable_directory() / L"sdgii23dmkf-safe.dll";

        if (!std::filesystem::is_regular_file(dll_path)) {
            std::wcerr << L"Missing DLL: " << dll_path << L'\n';
            return 2;
        }

        SetDefaultDllDirectories(LOAD_LIBRARY_SEARCH_SYSTEM32 |
                                 LOAD_LIBRARY_SEARCH_USER_DIRS);
        const DLL_DIRECTORY_COOKIE cookie =
            AddDllDirectory(dll_path.parent_path().c_str());
        if (cookie == nullptr) {
            std::wcerr << L"AddDllDirectory failed: " << GetLastError() << L'\n';
            return 3;
        }

        HMODULE module = LoadLibraryExW(
            dll_path.c_str(), nullptr,
            LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32);
        RemoveDllDirectory(cookie);

        if (module == nullptr) {
            std::wcerr << L"LoadLibraryExW failed: " << GetLastError() << L'\n';
            return 4;
        }

        const auto build_info = reinterpret_cast<SafeBuildInfoFn>(
            GetProcAddress(module, "SafeBuildInfo"));
        const auto self_test = reinterpret_cast<RunSelfTestFn>(
            GetProcAddress(module, "RunSelfTest"));

        if (build_info == nullptr || self_test == nullptr) {
            std::wcerr << L"Required safe exports are missing.\n";
            FreeLibrary(module);
            return 5;
        }

        std::wcout << build_info() << L'\n';
        const BOOL passed = self_test();
        FreeLibrary(module);

        if (!passed) {
            std::wcerr << L"Self-test failed.\n";
            return 6;
        }

        std::wcout << L"Self-test passed. No external process was modified.\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Fatal error: " << error.what() << '\n';
        return 1;
    }
}
