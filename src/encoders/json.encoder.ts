import { Encoder, ProjectManager, Frame, Project, FileWriteInfo, LabelClass, BoundboxProps, Label, ContourProps, PolylineProps, DEFAULT_LABEL_TYPES, Plugin } from "@infolks/labelmore-devkit";
import { ImageInfo } from "../types";

export class JsonEncoder extends Encoder {

    public readonly title = "ADAS JSON"
    public readonly icon = `<b>{}</b>`
    public static readonly NAME = 'encoders.adas.json'

    constructor(protected pm: ProjectManager) {
        super()
    }

    encode(frame: Frame, project: Project): FileWriteInfo[] {
        const frame_num = project.frames.findIndex(f => f.name === frame.name)

        // object labels
        const object_json = JSON.stringify(this.encodeObjectLabels(frame, project, frame_num), undefined, 4)

        // scene labels
        const scene_json = JSON.stringify(this.encodeSceneLabels(frame, project, frame_num), undefined, 4)

        const frame_name = frame.name.split('.').slice(0, -1)

        return [
            {
                name: `${project.title}_${frame_name}_object.json`,
                subdirectory: Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_${frame_name}_scene.json`,
                subdirectory: Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(scene_json)
            }
        ]
    }

    finalize(project: Project): FileWriteInfo[] {
        return []
    }

    /**
     * Encode object labels
     * @param frame frame to encode
     * @param project project to encode
     * @param frame_num frame number
     */
    private encodeObjectLabels(frame: Frame, project: Project, frame_num: number) {

        const FrameObjectLabels = []

        const channelMap = {
            'medium': 'CAMERAMedium',
            'high': 'CAMERAHigh',
            'low': 'CAMERALow'
        }

        const channel = project.options.extras.channel? channelMap[project.options.extras.channel]: 'none'

        const frame_name = frame.name.split('.').slice(0, -1).join(".")

        // find starting id
        const start = project.frames
            .slice(0, frame_num)
            .reduce((sum, f) => {
                return sum + f.labels.length
            }, 0)

        // For each label of frame
        frame.labels.forEach((label, index) => {

            // find its class
            const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id)

            // extract the image infos
            const image = {
                name: `${channel}_${frame_name}_${class_.name}_${label.id}.png`,
                size: frame.props.size || {
                    width: 0,
                    height: 0
                }
            }

            const track_id = start+index

            if (label.type === DEFAULT_LABEL_TYPES.boundbox) {

                FrameObjectLabels.push(this.encodeBbox(label, class_, image, track_id))
            }

            else if (label.type === DEFAULT_LABEL_TYPES.contour) {

                FrameObjectLabels.push(this.encodeContour(label, class_, image, track_id))
            }

            else if (label.type === DEFAULT_LABEL_TYPES.line) {

                FrameObjectLabels.push(this.encodePolyline(label, class_, image, track_id))
            }
        })

        return {
            FrameNumber: frame_num,
            TimeStamp: frame.name.split('.').slice(0,-1),
            FrameObjectLabels
        }
    }

    /**
     * Encode a frame
     * @param frame frame to encode
     * @param project the current project
     * @param frame_num the frame number
     */
    private encodeSceneLabels(frame: Frame, project: Project, frame_num: number) {

        const FrameSceneLabels = {}

        const frame_name = frame.name.split('.').slice(0, -1).join(".")

        for (let key in frame.props.scene) {

            const value = frame.props.scene[key]

            if (value) {
                FrameSceneLabels[key.trim()] = {
                    endtimestamp: frame_name,
                    starttimestamp: frame_name,
                    value
                }
            }
        }

        return {
            FrameNumber: frame_num,
            TimeStamp: frame.name.split('.').slice(0,-1),
            FrameSceneLabels
        }
    }

    /**
     * Encode bounding box labels
     * @param label the label to encode
     * @param class_ class of the label
     * @param image the image info
     */
    private encodeBbox(label: Label<BoundboxProps>, class_: LabelClass, image: ImageInfo, track_id: number) {

        let attributes = this.getAttributes(label)

        const {xmin, xmax, ymin, ymax} = label.props

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
        }
    }

    /**
     * Encode contour labels
     * @param label the label to encode
     * @param class_ class of the label
     * @param image the image info
     */
    private encodeContour(label: Label<ContourProps>, class_: LabelClass, image: ImageInfo, track_id: number) {

        let attributes = this.getAttributes(label)

        const points = label.props.points

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
        }
    }

    /**
     * Encode polyline labels
     * @param label the label to encode
     * @param class_ class of the label
     * @param image the image info
     */
    private encodePolyline(label: Label<PolylineProps>, class_: LabelClass, image: ImageInfo, track_id: number) {

        let attributes = this.getAttributes(label)

        const points = label.props.points

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
        }
    }

    /**
     * get attributes of a label
     * @param label annotation label
     */
    private getAttributes(label: Label<any>) {

        let attributes = {}


        for (let key in label.attributes) {

            const value = label.attributes[key]

            if (value && value.length) {
                attributes[key.trim()] = value
            }
        }

        return attributes
    }
}

export default Plugin.Encoder({
    name: JsonEncoder.NAME,
    provides: JsonEncoder,
    uses: ['projects']
})