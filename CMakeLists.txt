cmake_minimum_required(VERSION 3.20)
project(messenger_service CXX)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")
include(DownloadUserver)

find_package(userver COMPONENTS core mongo QUIET)
if(NOT TARGET userver::mongo)
  set(USERVER_FEATURE_MONGODB ON CACHE BOOL "" FORCE)
  download_userver(GIT_TAG v2.8)
endif()

userver_setup_environment()

add_library(${PROJECT_NAME}_objs OBJECT
  src/storage/storage.cpp
  src/auth/auth.cpp
  src/handlers/handlers.cpp
)
target_include_directories(${PROJECT_NAME}_objs PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)
target_link_libraries(${PROJECT_NAME}_objs PUBLIC userver::core userver::mongo)

add_executable(${PROJECT_NAME} src/main.cpp)
target_link_libraries(${PROJECT_NAME} PRIVATE ${PROJECT_NAME}_objs)

if(USERVER_FEATURE_TESTSUITE)
  userver_testsuite_add_simple(DATABASES mongo)
endif()

include(GNUInstallDirs)
if(DEFINED ENV{PREFIX})
  file(TO_CMAKE_PATH "$ENV{PREFIX}" PREFIX_PATH)
  set(CMAKE_INSTALL_PREFIX "${PREFIX_PATH}")
endif()

file(GLOB CONFIGS_FILES ${CMAKE_CURRENT_SOURCE_DIR}/configs/*.yaml ${CMAKE_CURRENT_SOURCE_DIR}/configs/*.json)
install(TARGETS ${PROJECT_NAME} DESTINATION ${CMAKE_INSTALL_BINDIR} COMPONENT ${PROJECT_NAME})
install(FILES ${CONFIGS_FILES} DESTINATION ${CMAKE_INSTALL_SYSCONFDIR}/${PROJECT_NAME} COMPONENT ${PROJECT_NAME})
