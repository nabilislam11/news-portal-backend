"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavMenu = void 0;
const mongoose_1 = require("mongoose");
const navMenuSchema = new mongoose_1.Schema({
    categoryIds: {
        type: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        validate: [(val) => val.length <= 10, "Nav menu limit is 10 items"],
        default: [],
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
});
exports.NavMenu = (0, mongoose_1.model)("NavMenu", navMenuSchema);
