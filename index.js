/**
 * index.js
 * ~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS
 */

function string() {
  let optional = false;
  return {
    validate: function(value) {
      // we need to validate here is if the value is of type string
      if (
        optional &&
        value === undefined
      ) {
        return {
          error: null,
          value: value
        }
      }
      if (typeof value !== "string") {
        return {
          error: `${value} must be of type string`,
          value: null
        };
      }
      return {
        error: null,
        value: value
      };
    },
    optional: function() {
      optional = true;
      return this;
    }
  };
}

function number() {
  let optional = false;
  return {
    validate: function(value) {
      if (
        optional &&
        value === undefined
      ) {
        return {
          error: null,
          value: value
        }
      }
      if (typeof value !== 'number') {
        return {
          error: `${value} must be of type number.`,
          value: null
        }
      }
      return {
        error: null,
        value: value
      }
    },
    optional: function() {
      optional = true;
      return this;
    }
  }
}

function object(validationSchema) {
  return {
    validate: function(payload) {
      // here we write our validation rule
      if (typeof payload !== "object" || payload === null) {
        throw new Error("Payload must be of type object.");
      }

      const errorPayload = {};
      const valuePayload = {};
      Object.keys(validationSchema).forEach(key => {
        const validation = validationSchema[key];
        const val = payload[key];

        const { error, value } = validation.validate(val);
        if (error !== null) {
          errorPayload[key] = error;
        } else {
          valuePayload[key] = value;
        }
      });
      return {
        error: errorPayload,
        value: valuePayload
      };
    }
  };
}

function main() {
  // here we validate the js objects types
  const payload = {
    name: 's'
  };

  const schema = object({
    name: string().optional(),
    age: number().optional()
  });
  const { error, value } = schema.validate(payload);
  console.log(error, value);
}
main();
