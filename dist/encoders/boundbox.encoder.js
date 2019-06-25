"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const labelmore_devkit_1 = require("@infolks/labelmore-devkit");
class BoundboxEncoder extends labelmore_devkit_1.Encoder {
    constructor(pm) {
        super();
        this.pm = pm;
        this.title = "ADAS Boundbox";
        this.icon = `<i class="fas fa-vector-square"></i>`;
        this.name = 'encoders.adas.boundbox';
    }
    encode(frame, project) {
        const frame_num = project.frames.findIndex(f => f.name === frame.name);
        // object labels
        const object_json = JSON.stringify(this.encodeObjectLabels(frame, project, frame_num));
        // scene labels
        const scene_json = JSON.stringify(this.encodeSceneLabels(frame, project, frame_num));
        const frame_name = frame.name.split('.').slice(0, -1);
        return [
            {
                name: `${project.title}_${frame_name}_object.json`,
                subdirectory: labelmore_devkit_1.Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_${frame_name}_scene.json`,
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
            const value = FrameSceneLabels[key];
            if (value) {
                FrameSceneLabels[key] = value;
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
        // const source = this.pm.getSource(project.options.inputSource)
        // const image = new Image()
        // image.src = source.join(project.options.inputSource, frame.name)
        frame.labels.forEach((label, index) => {
            if (label.type === labelmore_devkit_1.DEFAULT_LABEL_TYPES.boundbox) {
                const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id);
                const track_id = frame_num * numLabels + index;
                FrameObjectLabels.push(this.encodeLabel(label, class_, track_id, {
                    width: 0,
                    height: 0
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
        for (let key in label.attributes) {
            const value = attributes[key];
            if (value && value.length) {
                attributes[key] = value;
            }
        }
        const { xmin, xmax, ymin, ymax } = label.props;
        return {
            baseimage: "",
            roll: 0,
            pitch: 0,
            width: xmax - xmin,
            height: ymax - ymin,
            category: class_.name,
            Hierarchy: "",
            Trackid: 3,
            attributes,
            imagetype: "",
            imagename: "",
            imagedata: "",
            imageheight: image.height,
            imagewidth: image.width,
            shape: {
                "Algo Generated": "NO",
                "Manually Corrected": "YES",
                type: "Box",
                thickness: 2,
                x: [xmin, xmax, xmax, xmin],
                y: [ymin, ymin, ymax, ymax],
                z: []
            },
            keypoints: {}
        };
    }
}
exports.BoundboxEncoder = BoundboxEncoder;
exports.default = {
    install(Vue, opts) {
        Vue.mixin({
            beforeCreate() {
                if (this.$projects) {
                    const boxEnc = new BoundboxEncoder(this.$projects);
                    if (!this.$projects.hasEncoder(boxEnc.name)) {
                        this.$projects.registerEncoder(boxEnc.name, boxEnc);
                    }
                }
            }
        });
    }
};
//# sourceMappingURL=boundbox.encoder.js.map