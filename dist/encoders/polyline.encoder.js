"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const labelmore_devkit_1 = require("@infolks/labelmore-devkit");
class PolylineEncoder extends labelmore_devkit_1.Encoder {
    constructor(pm) {
        super();
        this.pm = pm;
        this.title = "ADAS Polyline";
        this.icon = `<i class="fas fa-bezier-curve"></i>`;
        this.name = 'encoders.adas.polyline';
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
                name: `${project.title}_Polyline_${frame_name}_object.json`,
                subdirectory: labelmore_devkit_1.Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_Polyline_${frame_name}_scene.json`,
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
        // const source = this.pm.getSource(project.options.inputSource)
        // const image = new Image()
        // image.src = source.join(project.options.inputSource, frame.name)
        frame.labels.forEach((label, index) => {
            if (label.type === labelmore_devkit_1.DEFAULT_LABEL_TYPES.line) {
                const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id);
                const track_id = frame_num * numLabels + index;
                FrameObjectLabels.push(this.encodeLabel(label, class_, track_id, {
                    name: frame.name,
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
            width: 0.0,
            height: 0.0,
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
                "Manually Corrected": "YES",
                type: "Polyline",
                thickness: 2,
                x: points.map(p => p.x),
                y: points.map(p => p.y),
                z: []
            },
            keypoints: {}
        };
    }
}
exports.PolylineEncoder = PolylineEncoder;
exports.default = {
    install(Vue, opts) {
        Vue.mixin({
            beforeCreate() {
                if (this.$projects) {
                    const lineEnc = new PolylineEncoder(this.$projects);
                    if (!this.$projects.hasEncoder(lineEnc.name)) {
                        this.$projects.registerEncoder(lineEnc.name, lineEnc);
                    }
                }
            }
        });
    }
};
//# sourceMappingURL=polyline.encoder.js.map