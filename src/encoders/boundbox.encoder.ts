import {Encoder, Project, Frame, FileWriteInfo, Label, BoundboxProps, LabelClass, DEFAULT_LABEL_TYPES, ProjectManager} from '@infolks/labelmore-devkit'
import {ImageInfo} from '../types'

export class BoundboxEncoder extends Encoder {
    
    public readonly title = "ADAS Boundbox"
    public readonly icon = `<i class="fas fa-vector-square"></i>`
    public readonly name = 'encoders.adas.boundbox'

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
                name: `${project.title}_BoundingBox_${frame_name}_object.json`,
                subdirectory: Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(object_json)
            },
            {
                name: `${project.title}_BoundingBox_${frame_name}_scene.json`,
                subdirectory: Encoder.SUBFOLDERS.ANNOTATIONS,
                data: Buffer.from(scene_json)
            }
        ]
    }
    
    
    finalize(project: Project): FileWriteInfo[] {
        return []
    }


    private encodeSceneLabels(frame: Frame, project: Project, frame_num: number) {

        const FrameSceneLabels = {}

        for (let key in frame.props.scene) {

            const value = frame.props.scene[key]

            if (value) {
                FrameSceneLabels[key.trim()] = value
            }
        }

        return {
            FrameNumber: frame_num,
            TimeStamp: frame.name.split('.').slice(0,-1),
            FrameSceneLabels
        }
    }

    private encodeObjectLabels(frame: Frame, project: Project, frame_num: number) {

        const FrameObjectLabels = []

        const numLabels = frame.labels.length

        // const source = this.pm.getSource(project.options.inputSource)

        // const image = new Image()

        // image.src = source.join(project.options.inputSource, frame.name)

        frame.labels.forEach((label, index) => {

            if (label.type === DEFAULT_LABEL_TYPES.boundbox) {

                const class_ = project.options.labelClasses.find(cl => cl.id === label.class_id)

                const track_id = frame_num*numLabels + index

                FrameObjectLabels.push(this.encodeLabel(
                    label, 
                    class_, 
                    {
                        name: frame.name,
                        size: frame.props.size || {
                            width: 0,
                            height: 0
                        }
                    }
                ))
            }
        })

        return {
            FrameNumber: frame_num,
            TimeStamp: frame.name.split('.').slice(0,-1),
            FrameObjectLabels
        }
    }

    private encodeLabel(label: Label<BoundboxProps>, class_: LabelClass, image: ImageInfo) {

        let attributes = {}

        console.log('attributes:',label.attributes)

        for (let key in label.attributes) {

            const value = label.attributes[key]

            if (value && value.length) {
                attributes[key.trim()] = value
            }
        }

        const {xmin, xmax, ymin, ymax} = label.props

        return {
            baseimage: "",
            roll: 0,
            pitch: 0,
            width: xmax - xmin,
            height: ymax - ymin,
            category: class_.name,
            Hierarchy: "",
            Trackid: label.id,
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
}

export default {
    install(Vue: any, opts: any) {

        Vue.mixin({
            beforeCreate() {

                if (this.$projects) {

                    const boxEnc = new BoundboxEncoder(this.$projects)

                    if (!this.$projects.hasEncoder(boxEnc.name)) {

                        this.$projects.registerEncoder(boxEnc.name, boxEnc)
                    }
                }
            }
        })
    }
}