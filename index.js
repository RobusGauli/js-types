/**
 * index.js
 * ~~~~~~~~~~~
 * This module provides the helper functions to validate your primitives in JS.
 
 */

const boolean = primitiveType("boolean");
const symbol = primitiveType("symbol");

function getType(value) {
  let val = `${value}`;
  if (isNaN(value) && val === "NaN") {
    return "NaN";
  }

  if (value === undefined && val === "undefined") {
    return "undefined";
  }

  if (value === null && val === "null") {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  return typeof value;
}

function primitiveTypeCheck(value, type) {
  const actualType = getType(value);
  if (actualType !== type) {
    return typeError(type, actualType);
  }
  return success(value);
}

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
    return {
      _optional: false,
      validate: function(value) {
        if (this._optional && (value === undefined || value === null)) {
          // safely return
          return success(value);
        }

        return primitiveTypeCheck(value, type);
      },
      optional: function() {
        this._optional = true;
        return this;
      }
    };
  };
}

function any(args) {
  if (getType(args) !== "array") {
    throw new TypeError("Must be of type number");
  }

  return args.reduce((acc, val) => acc || val, false);
}

function convertToInteger(value) {
  // value might be string i.e parsable number, integer, float
  return Math.round(parseFloat(value));
}

function convertToFloat(value, decimalPlaces) {
  // value might be string i.e parsable fnumber, integer, float
  return parseFloat(parseFloat(value).toFixed(decimalPlaces));
}

function checkForString(value) {
  let dotCount = 0;
  const codePointsFlag = Object.values(value).map((_, index) => {
    const codePoint = value.codePointAt(index);
    if (codePoint === 46) {
      dotCount++;
    }
    return (codePoint >= 48 && codePoint <= 57) || codePoint === 46
      ? false
      : true;
  });

  if (any(codePointsFlag)) {
    return typeError("number", "string");
  }
  // also check for ".34." that is more than one "."
  if (dotCount > 1) {
    return typeError("number", "string");
  }
  return success(value);
}

function number() {
  return {
    _type: "number",
    _optional: false,
    _min: null,
    _max: null,
    _toFloat: false,
    _toInteger: false,
    _decimalPlaces: null,
    validate: function(payload) {
      if (this._optional && (payload === undefined || payload === null)) {
        return success(payload);
      }

      if (getType(payload) === "string") {
        //
        const includeStringValidation = checkForString(payload);
        if (includeStringValidation.error) {
          return includeStringValidation;
        }
      }
      // check for infinity
      if (payload === Infinity) {
        return {
          error: 'Expected number but got Infinity.Invalid!',
          value: null
        }
      }
      const parsableNumber = parseFloat(payload);
      const value = primitiveTypeCheck(parsableNumber, this._type);
      if (value.error) {
        return value;
      }

      if (this._min !== null || this._max !== null) {
        const rangeResult = rangeCheck(
          parsableNumber,
          {
            min: this._min,
            max: this._max
          },
          this._type
        );
        if (rangeResult.error) {
          return rangeResult;
        }
      }
      let convertedPayload = payload;

      if (this._toInteger) {
        convertedPayload = convertToInteger(payload);
      } else if (this._toFloat) {
        convertedPayload = convertToFloat(payload, this._decimalPlaces);
      }
      return success(convertedPayload);
    },
    optional: function() {
      this._optional = true;
      return this;
    },
    max: function(value) {
      if (getType(value) !== "number") {
        throw new TypeError(`${value} must be of type number.`);
      }
      if (this._min !== null && value <= this._min) {
        throw new Error(
          `Max value ${value} must be greater than min value ${this._min}`
        );
      }
      this._max = value;
      return this;
    },
    min: function(value) {
      if (getType(value) !== "number") {
        throw new TypeError(`${value} must be of type number.`);
      }
      if (this._max !== null && value >= this._max) {
        throw new Error(
          `Min value ${value} must be less than max value ${this._max}`
        );
      }
      this._min = value;
      return this;
    },
    toInteger: function() {
      // check to see if _toFloat is true
      if (this._toFloat) {
        throw new Error(
          "Invalid Conversion scheme. Cannot be both float and integer."
        );
      }
      this._toInteger = true;
      return this;
    },
    toFloat: function(decimalPlaces = 3) {
      if (this._toInteger) {
        throw new Error(
          "Invalid conversion scheme. Cannot be both integer and float."
        );
      }
      if (getType(decimalPlaces) !== "number") {
        throw new TypeError('Invalid argument to function "toFloat".');
      }
      this._toFloat = true;
      this._decimalPlaces = decimalPlaces;
      return this;
    }
  };
}
function string() {
  return {
    _type: "string",
    _optional: false,
    _minLength: null,
    _maxLength: null,
    validate: function(payload) {
      if (this._optional && (payload === undefined || payload === null)) {
        return success(payload);
      }

      const value = primitiveTypeCheck(payload, this._type);
      if (value.error) {
        return value;
      }

      if (this._minLength !== null || this._maxLength !== null) {
        const lengthResult = lengthCheck(
          Object.values(payload),
          {
            minLength: this._minLength,
            maxLength: this._maxLength
          },
          this._type
        );

        if (lengthResult.error) {
          return lengthResult;
        }
      }
      return success(payload);
    },
    optional: function() {
      this._optional = true;
      return this;
    },
    ...LengthMixins
  };
}

function object(validationSchema) {
  return {
    _type: "object",
    _optional: false,
    _minLength: null,
    _maxLength: null,
    validate: function(payload) {
      // here we write our validation rule
      if (this._optional && (payload === undefined || payload === null)) {
        //safely return
        return success(payload);
      }

      const value = primitiveTypeCheck(payload, "object");
      if (value.error) {
        return value;
      }
      // before validating each item we first validate the length
      if (this._minLength !== null || this._maxLength !== null) {
        const lengthResult = lengthCheck(
          Object.keys(payload),
          {
            minLength: this._minLength,
            maxLength: this._maxLength
          },
          this._type
        );
        if (lengthResult.error) {
          return lengthResult;
        }
      }
      const errorPayload = {};
      const valuePayload = {};
      Object.keys(validationSchema).forEach(key => {
        const validation = validationSchema[key];
        if (
          typeof validation !== "object" ||
          validation === null ||
          !validation.validate ||
          typeof validation.validate !== "function"
        ) {
          throw new TypeError(`Invalid schema for ${key}`);
        }
        const val = payload[key];

        const { error, value } = validation.validate(val);
        if (error !== null) {
          errorPayload[key] = error;
        } else {
          valuePayload[key] = value;
        }
      });
      return {
        error: Object.keys(errorPayload).length ? errorPayload : null,
        value: Object.keys(valuePayload).length ? valuePayload : null
      };
    },
    optional: function() {
      this._optional = true;
      return this;
    },
    ...LengthMixins
  };
}
// goes to util in future

function all(args) {
  if (!Array.isArray(args)) {
    throw new TypeError("Argument must be of type array.");
  }

  return args.reduce((acc, val) => acc && val, true);
}

function lengthError(type, lengthSchema, minFailed) {
  if (minFailed) {
    return {
      error: `${type} must have minimum length of ${lengthSchema.minLength}`,
      value: null
    };
  }
  return {
    error: `${type} must have maximum length of ${lengthSchema.maxLength}`,
    value: null
  };
}

function rangeError(type, rangeSchema, minFailed) {
  if (minFailed) {
    return {
      error: `${type} can have min value of ${rangeSchema.min}.`,
      value: null
    };
  }
  return {
    error: `${type} can have max value of ${rangeSchema.max}.`,
    value: null
  };
}

// Range check for number
function rangeCheck(value, rangeSchema, type) {
  if (typeof value !== "number") {
    throw new TypeError(`${value} must be of type number.`);
  }
  const { min, max } = rangeSchema;
  if (min !== null && getType(min) === "number" && value < min) {
    return rangeError(type, rangeSchema, true);
  }

  if (max !== null && getType(max) === "number" && value > max) {
    return rangeError(type, rangeSchema, false);
  }
  return success(value);
}

// length check for string/array
function lengthCheck(value, lengthSchema, type) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${value} must be of type Array.`);
  }
  if (
    lengthSchema.minLength !== null &&
    getType(lengthSchema.minLength) === "number" &&
    value.length < lengthSchema.minLength
  ) {
    return lengthError(type, lengthSchema, true);
  }

  const maxLength = lengthSchema.maxLength;
  if (
    maxLength !== null &&
    getType(maxLength) === "number" &&
    value.length > maxLength
  ) {
    return lengthError(type, lengthSchema, false);
  }

  return success(value);
}

const LengthMixins = {
  minLength: function(length) {
    const lengthType = getType(length);
    if (lengthType !== "number") {
      throw new TypeError(
        `Argument to the minLength must be of type number but got ${lengthType}.`
      );
    }
    if (this._maxLength !== null && this._minLength >= this._maxLength) {
      throw new Error(
        "Min length must be less than Max Length. Length Mismatch."
      );
    }
    this._minLength = length;
    return this;
  },
  maxLength: function(length) {
    const lengthType = getType(length);
    if (lengthType !== "number") {
      throw new TypeError(
        `Argument to the minLength must be of type numner but got ${lengthType}.`
      );
    }

    if (this._minLength !== null && length <= this._minLength) {
      throw new Error(
        "Max length must be greater than Min Length. Length Mismatch."
      );
    }

    this._maxLength = length;
    return this;
  }
};

function list(validationSchema) {
  return {
    _type: "array",
    _optional: false,
    _minLength: null,
    _maxLength: null,
    validate: function(payload) {
      if (this._optional && (payload === undefined || payload === null)) {
        // safely return from the validation
        return success(payload);
      }
      const value = primitiveTypeCheck(payload, "array");

      if (value.error) {
        return value;
      }

      // before validating each item we irst validate the length
      if (this._minLength !== null || this._maxLength !== null) {
        const lengthResult = lengthCheck(
          payload,
          {
            minLength: this._minLength,
            maxLength: this._maxLength
          },
          this._type
        );
        if (lengthResult.error) {
          return lengthResult;
        }
      }
      const res = payload.reduce((acc, val, index) => {
        const { error, value } = validationSchema.validate(val);
        return error !== null
          ? { ...acc, [index]: { error: error, value: value } }
          : { ...acc };
      }, {});

      if (all(Object.values(res).map(v => v.error === null))) {
        return {
          error: null,
          value: payload
        };
      }
      return {
        error: res,
        value: null
      };
    },
    optional: function() {
      this._optional = true;
      return this;
    },
    ...LengthMixins
  };
}

function main() {
  //  here we validate the js objects types
  // const payload = {
  //   name: "swww",
  //   age: 10,
  //   friends: [{name:'asd', age: 2}]
  // };
  // const schema = object({
  //   detail: object({
  //     firstName: number().optional(),
  //     lastName: number().optional()
  //   }).optional(),
  //   friends: list(object({ name: string(), age: number() })).optional().maxLength(2)
  // }).maxLength(3);

  // const f = list(object({name: string().minLength(2)})).minLength(2).maxLength(3);

  // const { error, value } = schema.validate(payload);
  // console.log(error);
  // console.log(value);
  // const s = string();
  // const r = s.validate("s");
  // console.log(r);

  const n = number()
    .optional()
    .toFloat(2);
  const { error, value } = n.validate(Infinity);
  console.log(error, value);
}

main();
