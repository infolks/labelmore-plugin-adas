"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const labelmore_devkit_1 = require("@infolks/labelmore-devkit");
class PixelwiseEncoder extends labelmore_devkit_1.Encoder {
    constructor(pm) {
        super();
        this.pm = pm;
        this.title = "ADAS Pixelwise";
        this.icon = `<i class="fas fa-th"></i>`;
        this.name = 'encoders.adas.pixelwise';
    }
    encode(frame, project) {
        const frame_num = project.frames.findIndex(f => f.name === frame.name);
        // object labels
        const object_json = JSON.stringify(this.encodeObjectLabels(frame, project, frame_num), undefined, 4);
        // scene labels
        const scene_json = JSON.stringify(this.encodeSceneLabels(frame, project, frame_num), undefined, 4);
        const frame_name = frame.name.split('.').slice(0, -1);
        return [
            {
                name: `${project.title}_Pixelwise_${frame_name}_object.json`,
                subdirectory: labelmore_devkit_1.Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_Pixelwise_${frame_name}_scene.json`,
                subdirectory: labelmore_devkit_1.Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(scene_json)
            }
        ];
    }
    finalize(project) {
        return [];
    }
    encodeSceneLabels(frame, project, frame_num) {
        const FrameSceneLabels = {};
        for (let key in frame.props.scene) {
            const value = frame.props.scene[key];
            if (value) {
                FrameSceneLabels[key.trim()] = value;
            }
        }
        return {
            FrameNumber: frame_num,
            TimeStamp: new Date().getTime(),
            FrameSceneLabels
        };
    }
    encodeObjectLabels(frame, project, frame_num) {
        const FrameObjectLabels = [];
        const numLabels = frame.labels.length;
        const channelMap = {
            'medium': 'CAMERAMedium',
            'high': 'CAMERAHigh',
            'low': 'CAMERALow'
        };
        const channel = project.options.extras.channel ? channelMap[project.options.extras.channel] : null;
        const frame_name = frame.name.split('.').slice(0, -1);
        frame.labels.forEach((label, index) => {
            if (label.type === labelmore_devkit_1.DEFAULT_LABEL_TYPES.contour) {
                const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id);
                const track_id = frame_num * numLabels + index;
                FrameObjectLabels.push(this.encodeLabel(label, class_, track_id, {
                    name: `${channel}_${frame_name}_${class_.name}_${track_id}.png`,
                    size: frame.props.size || {
                        width: 0,
                        height: 0
                    }
                }));
            }
        });
        return {
            FrameNumber: frame_num,
            TimeStamp: new Date().getTime(),
            FrameObjectLabels
        };
    }
    encodeLabel(label, class_, track_id, image) {
        let attributes = {};
        console.log('attributes:', label.attributes);
        for (let key in label.attributes) {
            const value = label.attributes[key];
            if (value && value.length) {
                attributes[key.trim()] = value;
            }
        }
        const points = label.props.points;
        return {
            baseimage: "",
            roll: 0,
            pitch: 0,
            width: image.size.width,
            height: image.size.height,
            category: class_.name,
            Hierarchy: "",
            Trackid: track_id,
            attributes,
            imagetype: "",
            imagename: image.name,
            imagedata: "",
            imageheight: image.size.height,
            imagewidth: image.size.width,
            shape: {
                "Algo Generated": "NO",
                "Manually Corrected": "NO",
                type: "Pixel",
                thickness: 2,
                x: points.map(p => p.x),
                y: points.map(p => p.y),
                z: []
            },
            keypoints: {}
        };
    }
}
exports.PixelwiseEncoder = PixelwiseEncoder;
exports.default = {
    install(Vue, opts) {
        Vue.mixin({
            beforeCreate() {
                if (this.$projects) {
                    const pixelEnc = new PixelwiseEncoder(this.$projects);
                    if (!this.$projects.hasEncoder(pixelEnc.name)) {
                        this.$projects.registerEncoder(pixelEnc.name, pixelEnc);
                    }
                }
            }
        });
    }
};
//# sourceMappingURL=pixelwise.encoder.js.map