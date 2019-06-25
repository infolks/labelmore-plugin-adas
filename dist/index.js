"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boundbox_encoder_1 = require("./encoders/boundbox.encoder");
const polyline_encoder_1 = require("./encoders/polyline.encoder");
const pixelwise_encoder_1 = require("./encoders/pixelwise.encoder");
exports.default = {
    install(Vue, opts) {
        // encoders
        Vue.use(boundbox_encoder_1.default);
        Vue.use(polyline_encoder_1.default);
        Vue.use(pixelwise_encoder_1.default);
    }
};
//# sourceMappingURL=index.js.map