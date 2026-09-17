cmake_minimum_required(VERSION 3.20)
project(SanitizedWindowsTools LANGUAGES CXX)

if(NOT WIN32)
  message(FATAL_ERROR "This project builds Windows PE files and requires Windows.")
endif()

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(safe_payload SHARED src/safe_payload.cpp)
set_target_properties(safe_payload PROPERTIES
  OUTPUT_NAME "sdgii23dmkf-safe"
  PREFIX ""
)

add_executable(safe_runner src/safe_runner.cpp)
set_target_properties(safe_runner PROPERTIES
  OUTPUT_NAME "hokkinjector-safe"
)

if(MSVC)
  foreach(target safe_payload safe_runner)
    target_compile_options(${target} PRIVATE /W4 /WX /permissive- /sdl /guard:cf)
    target_link_options(${target} PRIVATE /DYNAMICBASE /NXCOMPAT /CETCOMPAT /guard:cf)
  endforeach()
endif()
