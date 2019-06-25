"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const boundbox_encoder_1 = require("./encoders/boundbox.encoder");
exports.default = {
    install(Vue, opts) {
        // encoders
        Vue.use(boundbox_encoder_1.default);
    }
};
//# sourceMappingURL=index.js.map