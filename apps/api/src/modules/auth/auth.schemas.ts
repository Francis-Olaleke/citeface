export const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "displayName", "username"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 254,
      },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 128,
      },
      displayName: {
        type: "string",
        minLength: 2,
        maxLength: 80,
      },
      username: {
        type: "string",
        minLength: 3,
        maxLength: 30,
        pattern: "^[a-zA-Z0-9_]+$",
      },
    },
  },
} as const;

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        maxLength: 254,
      },
      password: {
        type: "string",
        minLength: 1,
        maxLength: 128,
      },
    },
  },
} as const;