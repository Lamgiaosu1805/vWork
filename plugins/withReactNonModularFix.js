const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const RNFB_TARGETS = ["RNFBApp", "RNFBMessaging"]; // add more if you add e.g. RNFBAuth, RNFBAnalytics, etc.

const GLOBAL_MARKER = "# @withModularHeadersFix:global_non_modular";
const RNFB_MARKER = "# @withModularHeadersFix:rnfb_non_modular";
const MODULAR_HEADERS_MARKER = "# @withModularHeadersFix:use_modular_headers";
const FMT_MARKER = "# @withModularHeadersFix:fmt_consteval";

module.exports = function withModularHeadersFix(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfilePath, "utf-8");

      const postInstallMatch = contents.match(/post_install do \|installer\|/);
      if (!postInstallMatch) {
        throw new Error(
          "withModularHeadersFix: could not find existing `post_install do |installer|` block in Podfile",
        );
      }
      const insertAt = postInstallMatch.index + postInstallMatch[0].length;
      let injected = "";

      // --- Fix 1: allow non-modular includes for ALL pods (needed for prebuilt XCFrameworks e.g. OmiKit) ---
      if (!contents.includes(GLOBAL_MARKER)) {
        injected += `
    ${GLOBAL_MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"
      end
    end
    installer.pods_project.build_configurations.each do |build_config|
      build_config.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"
    end
`;
      }

      // --- Fix 2: react-native-firebase/app+messaging + useFrameworks:static known bug
      //     https://github.com/expo/expo/issues/39607 ---
      if (!contents.includes(RNFB_MARKER)) {
        injected += `
    ${RNFB_MARKER}
    installer.pods_project.targets.each do |target|
      if ${JSON.stringify(RNFB_TARGETS)}.include?(target.name)
        target.build_configurations.each do |build_config|
          build_config.build_settings["CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"] = "YES"
          other_cflags = build_config.build_settings["OTHER_CFLAGS"] ||= ["$(inherited)"]
          build_config.build_settings["OTHER_CFLAGS"] = (other_cflags + ["-Wno-non-modular-include-in-framework-module"]).uniq
        end
      end
    end
`;
      }

      // --- Fix 3: fmt 11.0.2 consteval build error on Xcode 26.4+ (Apple Clang 21) when
      //     building React Native from source (buildReactNativeFromSource: true).
      //     https://github.com/facebook/react-native/issues/55601
      //     https://github.com/expo/expo/issues/44229 ---
      if (!contents.includes(FMT_MARKER)) {
        injected += `
    ${FMT_MARKER}
    begin
      fmt_base_header = File.join(installer.sandbox.pod_dir("fmt").to_s, "include", "fmt", "base.h")
      if File.exist?(fmt_base_header)
        fmt_contents = File.read(fmt_base_header)
        patched = fmt_contents.gsub(/#\\s*define FMT_USE_CONSTEVAL 1/, "# define FMT_USE_CONSTEVAL 0")
        File.write(fmt_base_header, patched) if patched != fmt_contents
      end
    rescue => e
      Pod::UI.puts "withModularHeadersFix: skipped fmt consteval patch (#{e.message})"
    end
`;
      }

      if (injected) {
        contents =
          contents.slice(0, insertAt) +
          "\n" +
          injected +
          contents.slice(insertAt);
      }

      // --- Fix 4: Swift pods (FirebaseCoreInternal -> GoogleUtilities) need modular headers
      //     when building with static libraries/frameworks (use_frameworks! :linkage => :static). ---
      if (!contents.includes(MODULAR_HEADERS_MARKER)) {
        const useFrameworksMatch = contents.match(/^\s*use_frameworks!.*$/m);
        if (useFrameworksMatch) {
          const lineEnd =
            useFrameworksMatch.index + useFrameworksMatch[0].length;
          contents =
            contents.slice(0, lineEnd) +
            `\n  ${MODULAR_HEADERS_MARKER}\n  use_modular_headers!` +
            contents.slice(lineEnd);
        } else {
          const targetMatch = contents.match(/^target ['"][^'"]+['"] do$/m);
          if (!targetMatch) {
            throw new Error(
              "withModularHeadersFix: could not find a place to insert use_modular_headers! in Podfile",
            );
          }
          const tInsertAt = targetMatch.index + targetMatch[0].length;
          contents =
            contents.slice(0, tInsertAt) +
            `\n  ${MODULAR_HEADERS_MARKER}\n  use_modular_headers!` +
            contents.slice(tInsertAt);
        }
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
