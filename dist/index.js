/*!
 * labelmore-plugin-adas v1.2.0
 * (c) infolks
 * Released under the ISC License.
 */
'use strict';

var labelmoreDevkit = require('@infolks/labelmore-devkit');

class JsonEncoder extends labelmoreDevkit.Encoder {
    constructor(pm) {
        super();
        this.pm = pm;
        this.title = "ADAS JSON";
        this.icon = `<b>{}</b>`;
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
                name: `${project.title}_${frame_name}_object.json`,
                subdirectory: labelmoreDevkit.Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_${frame_name}_scene.json`,
                subdirectory: labelmoreDevkit.Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(scene_json)
            }
        ];
    }
    finalize(project) {
        return [];
    }
    /**
     * Encode object labels
     * @param frame frame to encode
     * @param project project to encode
     * @param frame_num frame number
     */
    encodeObjectLabels(frame, project, frame_num) {
        const FrameObjectLabels = [];
        const channelMap = {
            'medium': 'CAMERAMedium',
            'high': 'CAMERAHigh',
            'low': 'CAMERALow'
        };
        const channel = project.options.extras.channel ? channelMap[project.options.extras.channel] : 'none';
        const frame_name = frame.name.split('.').slice(0, -1);
        // find starting id
        const start = project.frames
            .slice(0, frame_num)
            .reduce((sum, f) => {
            return sum + f.labels.length;
        }, 0);
        // For each label of frame
        frame.labels.forEach((label, index) => {
            // find its class
            const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id);
            // extract the image infos
            const image = {
                name: `${channel}_${frame_name}_${class_.name}_${label.id}.png`,
                size: frame.props.size || {
                    width: 0,
                    height: 0
                }
            };
            const track_id = start + index;
            if (label.type === labelmoreDevkit.DEFAULT_LABEL_TYPES.boundbox) {
                FrameObjectLabels.push(this.encodeBbox(label, class_, image, track_id));
            }
            else if (label.type === labelmoreDevkit.DEFAULT_LABEL_TYPES.contour) {
                FrameObjectLabels.push(this.encodeContour(label, class_, image, track_id));
            }
            else if (label.type === labelmoreDevkit.DEFAULT_LABEL_TYPES.line) {
                FrameObjectLabels.push(this.encodePolyline(label, class_, image, track_id));
            }
        });
        return {
            FrameNumber: frame_num,
            TimeStamp: frame.name.split('.').slice(0, -1),
            FrameObjectLabels
        };
    }
    /**
     * Encode a frame
     * @param frame frame to encode
     * @param project the current project
     * @param frame_num the frame number
     */
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
            TimeStamp: frame.name.split('.').slice(0, -1),
            FrameSceneLabels
        };
    }
    /**
     * Encode bounding box labels
     * @param label the label to encode
     * @param class_ class of the label
     * @param image the image info
     */
    encodeBbox(label, class_, image, track_id) {
        let attributes = this.getAttributes(label);
        const { xmin, xmax, ymin, ymax } = label.props;
        return {
            baseimage: "",
            roll: 0,
            pitch: 0,
            width: xmax - xmin,
            height: ymax - ymin,
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
                type: "Box",
                thickness: 2,
                x: [xmin, xmax, xmax, xmin],
                y: [ymin, ymin, ymax, ymax],
                z: []
            },
            keypoints: {}
        };
    }
    /**
     * Encode contour labels
     * @param label the label to encode
     * @param class_ class of the label
     * @param image the image info
     */
    encodeContour(label, class_, image, track_id) {
        let attributes = this.getAttributes(label);
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
    /**
     * Encode polyline labels
     * @param label the label to encode
     * @param class_ class of the label
     * @param image the image info
     */
    encodePolyline(label, class_, image, track_id) {
        let attributes = this.getAttributes(label);
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
    /**
     * get attributes of a label
     * @param label annotation label
     */
    getAttributes(label) {
        let attributes = {};
        for (let key in label.attributes) {
            const value = label.attributes[key];
            if (value && value.length) {
                attributes[key.trim()] = value;
            }
        }
        return attributes;
    }
}
JsonEncoder.NAME = 'encoders.adas.json';
var JsonEncoder$1 = labelmoreDevkit.Plugin.Encoder({
    name: JsonEncoder.NAME,
    provides: JsonEncoder,
    uses: ['projects']
});

var index = labelmoreDevkit.Plugin.Package({
    plugins: [
        JsonEncoder$1
    ]
});

module.exports = index;
