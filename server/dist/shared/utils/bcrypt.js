"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.hash = void 0;
const hash = async (s) => s;
exports.hash = hash;
const compare = async (s, hashStr) => s === hashStr;
exports.compare = compare;
