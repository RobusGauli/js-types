/**
 * index.js
 * ~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS
 */

const string = primitiveType("string");
const number = primitiveType("number");
const boolean = primitiveType("boolean");
const symbol = primitiveType("symbol");

function primitiveCheckerRegistry() {
  // registry to maintain type and contract
  let registry = {};
  return {
    register: function(type) {
      return function(func) {
        registry[type] = func;
        return func;
      };
    },
    dispatch: function(type) {
      return function(value) {
        return registry[type](value);
      };
    }
  };
}

const primitiveChecker = primitiveCheckerRegistry();

const stringContract = primitiveChecker.register("string")(function(value) {
  if (typeof value !== "string") {
    return typeError("string", typeof value);
  }
  return success(value);
});

const numberContract = primitiveChecker.register("number")(function(value) {
  if (isNaN(value) && typeof value === 'number') {
    return typeError("number", "NaN");
  }

  if (typeof value !== "number") {
    return typeError("number", typeof value);
  }
  return success(value);
});

const booleanContract = primitiveChecker.register("boolean")(function(value) {
  if (typeof value !== "boolean") {
    return typeError("boolean", typeof value);
  }
  return success(value);
});

const symbolContract = primitiveChecker.register("symbol")(function(value) {
  if (typeof value !== "symbol") {
    return typeError("symbol", typeof value);
  }
});

function success(value) {
  return {
    error: null,
    value: value
  };
}

function typeError(expected, actual) {
  return {
    error: `Expected ${expected} but got ${actual}`,
    value: null
  };
}

function primitiveType(type) {
  return function() {
    let optional = false;
    return {
      validate: function(value) {
        if (optional && (value === undefined || value === null)) {
          // safely return
          return success(value);
        }

        return primitiveChecker.dispatch(type)(value);

        return success(value);
      },
      optional: function() {
        optional = true;
        return this;
      }
    };
  };
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
    name: 3,
    age: 's'
  };

  const schema = object({
    name: string().optional(),
    age: number().optional()
  });
  const { error, value } = schema.validate(payload);
  console.log(error);
  
}
main();
