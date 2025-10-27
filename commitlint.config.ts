import type { UserConfig } from "@commitlint/types";
import { RuleConfigSeverity } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  defaultIgnores: false,
  rules: {
    // Enforce specific commit types
    "type-enum": [
      RuleConfigSeverity.Error,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
        "merge",
        "fixup",
      ],
    ],
    // Enforce a maximum header length of 80 characters
    // "header-max-length": [RuleConfigSeverity.Error, "always", 80],
    "header-max-length2": [RuleConfigSeverity.Error, "always"],
    // Enforce a minimum subject length of 15 characters
    "subject-min-length": [RuleConfigSeverity.Error, "always", 15],
    // Enforce the subject does not contain the repository name
    "subject-repo-name": [RuleConfigSeverity.Error, "never"],
    // Enforce no emojis in the header
    "header-emojis": [RuleConfigSeverity.Error, "never"],
    // Enforce specific format for merge commits
    "merge-format": [RuleConfigSeverity.Error, "always"],
  },
  plugins: [
    {
      rules: {
        // Custom rule to ensure the subject does not contain the repository name
        "subject-repo-name": ({ subject }) => {
          const repoName: string = "Enoal-Fauchille-Bolle/AREA";

          // If subject is missing or not a string, let other rules handle it
          if (!subject || typeof subject !== "string") {
            return [true];
          }

          const lowerSubject = subject.toLowerCase();
          const lowerRepoName = repoName.toLowerCase();

          // Check if the subject contains the repository name
          if (lowerSubject.includes(lowerRepoName)) {
            return [
              false,
              `subject must not contain the repository name: "${repoName}"`,
            ];
          }

          return [true];
        },

        // Custom rule to ensure the header does not contain emojis
        "header-emojis": ({ header }) => {
          const emojiRegex =
            /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

          // If header is missing or not a string, let other rules handle it
          if (!header || typeof header !== "string") {
            return [true];
          }

          // Check for emojis in the header
          if (emojiRegex.test(header)) {
            return [false, `header must not contain emojis`];
          }
          return [true];
        },

        // Custom rule to enforce specific format for merge commits
        "merge-format": ({ header, type }) => {
          const mergeFormatRegex = /^merge: branch `([^`]+)` into `([^`]+)`$/;
          const mergeFormatRegexAlt = /^merge: `([^`]+)` into `([^`]+)`$/;

          // If header is missing or not a string, let other rules handle it
          if (!header || typeof header !== "string") {
            return [false, "header must be a non-empty string"];
          }

          // If it's not a merge type, allow it (other rules will apply)
          if (type !== "merge") {
            return [true];
          }

          // If it is merge, check the exact format
          if (!mergeFormatRegex.test(header) && !mergeFormatRegexAlt.test(header)) {
            return [
              false,
              "merge commit must be in format: merge: branch `branch1` into `branch2`",
            ];
          }
          return [true];
        },

        // Custom rule to enforce maximum header length of 80 characters, excluding "merge" commits
        "header-max-length2": ({ header, type }, when) => {
          const maxLength = 80;

          // If header is missing or not a string, let other rules handle it
          if (!header || typeof header !== "string") {
            return [true];
          }

          // Exclude "merge" commits from this rule
          if (type === "merge") {
            return [true];
          }

          const isValid = header.length <= maxLength;

          if (when === "always" && !isValid) {
            return [
              false,
              `header must not exceed ${maxLength} characters (current length: ${header.length})`,
            ];
          }

          return [true];
        },
      },
    },
  ],
};

export default Configuration;
