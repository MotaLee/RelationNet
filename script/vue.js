var CW=document.body.clientWidth
var CH=document.documentElement.clientHeight
document.oncontextmenu = function(){return false}
document.onkeydown=function(e){
    let key=window.event.code
    // console.log(key)
    switch (key) {
        case 'Escape':
            V_CVS.onESC()
            break;
        case 'KeyX':
            if(window.event.ctrlKey) V_CVS.onDel()
            break
        default:break;
    }
}
// Vue.
var V_CVS=new Vue({
    el:"#div_cvs",
    data:{
        net:{},
        points:{},
        links:{},
        scale:1.0,
        back_color:"#000",
        ena_pan:true,
        ena_drag:true,
        ena_free:false,
        visible:true,
        stg_add:false,
        nid_from:null,
        lid_from:null,
        CvsStl:{
            width:"100px",height:"100px",
            left:"0px",top:"0px",display:'none',},
    },
    methods:{
        newNet:function(rn){
            this.net=rn
            v_netname.netname=rn.name
            v_splash.visible=false
            let gph=rn.acvtiveGraph()
            let stl=RN.getStyle(gph.nid,'graph')
            this.back_color=stl.back_color
            this.CvsStl.width=gph.geo[3]+"px"
            this.CvsStl.height=gph.geo[4]+"px"
            this.CvsStl.display="block"
            this.stg_visible=true
            this.genCVSData()
            resizeCanvas(gph.geo[3],gph.geo[4])
        },
        genCVSData:function(){
            let gph=RN.getGraph()
            this.points={}
            this.links={}
            let nids=RN.getGraphEle()
            for (let i = 0; i < nids.length; i++) {
                if(RN.hasEle(nids[i])){
                    this.points[nids[i]]=this.genPointData(nids[i])
                }else if(RN.hasEle(nids[i],'link')){
                    this.links[nids[i]]=this.genLinkData(nids[i])
                }
            }
        },
        refreshCVS(af=null){
            this.visible=false
            this.$nextTick(()=>{
                this.visible=true
                if (af!=null){
                    this.$nextTick(()=>{
                        document.getElementById(af).focus()
                    })
                }

            })
            loop()
        },
        drawGraph(clr=true) {
            if(clr) clear()
            background(this.back_color)
            if(this.stg_add){
                strokeWeight(2)
                stroke("#fc9")
                noFill()
                circle(window.event.layerX,window.event.layerY,50)
            }
            if(this.nid_from!=null){
                strokeWeight(2)
                stroke("#fc9")
                fill(this.back_color)
                circle(window.event.layerX,window.event.layerY,50)
                let ol=RN.getOverlay(this.nid_from)
                line(window.event.layerX,window.event.layerY,ol.geo[1],ol.geo[2])
            }
            if(this.lid_from!=null){
                strokeWeight(2)
                stroke("#fc9")
                fill(this.back_color)
                circle(window.event.layerX,window.event.layerY,50)
                let lx=parseInt(this.links[this.lid_from].left)
                let ly=parseInt(this.links[this.lid_from].top)
                line(window.event.layerX,window.event.layerY,lx,ly)
            }

            let gph=RN.getGraph()
            let gphstl=RN.getStyle(gph.nid,'graph')
            let pairs=Object.entries(gph.overlay)
            for(let i=0;i<pairs.length;i++) {
                if(!RN.links.hasOwnProperty(pairs[i][0])) continue
                // 连线和端点绘制
                let link=RN.links[pairs[i][0]]
                let arr=this.calcLinkMid(link)
                let arr_se=[...arr[2],...arr[3]]
                let midx=arr[0],midy=arr[1]
                let stl=RN.getStyle(link.lid,'link')
                fill(stl.font_color)
                stroke(stl.font_color)
                for (let j = 0;j < arr_se.length;j++){
                    var px=gph.overlay[arr_se[j].nid].geo[1]
                    var py=gph.overlay[arr_se[j].nid].geo[2]
                    var r=gph.overlay[arr_se[j].nid].geo[3]/2
                    var s=stl.tmn_size
                    let d=-1
                    if(px<midx) d*=-1
                    if(j<arr[2].length){
                        var shape=stl.tmn_shape[0]
                    }else{
                        var shape=stl.tmn_shape[1]
                    }
                    strokeWeight(stl.line_wgt)
                    line(midx,midy,px,py)
                    switch (shape) {
                        case "箭头":
                            strokeWeight(0)
                            if(midx==px) var theta=HALF_PI
                            else var theta=atan((midy-py)/(midx-px))
                            var _s=sin(theta),_c=cos(theta)
                            triangle(px+d*r*_c,py+d*r*_s,
                                px+d*(r+s)*_c+s*_s/2,py+d*(r+s)*_s-s*_c/2,
                                px+d*(r+s)*_c-s*_s/2,py+d*(r+s)*_s+s*_c/2)
                            break;
                        default:break;
                    }

                }
                // 连线描述绘制
                let geo=RN.getOverlay(link.lid).geo
                if (this.links[link.lid].stg_slct) {
                    strokeWeight(2)
                    stroke("#fc9")
                    noFill()
                    rect(midx+geo[1]-textWidth(link.desc)/2-4,
                        midy+geo[2]-stl.font_size/2-4,
                        Math.max(CH/50,textWidth(link.desc))+4,
                        stl.font_size+4)
                }
                strokeWeight(0)
                fill(gphstl.back_color)
                textSize(stl.font_size)
                rect(midx+geo[1]-textWidth(link.desc)/2-2,
                    midy+geo[2]-stl.font_size/2-2,
                    textWidth(link.desc)+2,
                    stl.font_size+2)
                textAlign(CENTER,CENTER)
                fill(stl.font_color)
                text(link.desc,midx+geo[1],midy+geo[2])

            }
            for (let i = 0;i<pairs.length;i++) {
                if(!RN.points.hasOwnProperty(pairs[i][0])) continue
                let geo=pairs[i][1].geo
                let node=RN.points[pairs[i][0]]
                let stl=RN.getStyle(node.nid,'point')
                strokeWeight(2)
                switch (stl.shape) {
                    default:    // "自由圆"
                        if (this.points[node.nid].stg_slct) {
                            stroke("#fc9")
                            noFill()
                            circle(geo[1],geo[2],geo[3]+10)
                        }
                        stroke(stl.font_color)
                        fill(stl.back_color)
                        circle(geo[1],geo[2],geo[3])
                        break;
                }
                fill(stl.font_color)
                textSize(stl.font_size)
                textAlign(CENTER,CENTER)
                strokeWeight(0)
                text(node.name,geo[1],geo[2])
            }

        },
        // Mouse events.
        onMove:function(e){
            if (this.ena_pan&&e.buttons==4){
                this.CvsStl.left=parseInt(this.CvsStl.left)+e.movementX+'px'
                this.CvsStl.top=parseInt(this.CvsStl.top)+e.movementY+'px'
            }
            if(this.stg_add&&e.buttons==2){
                this.drawGraph()
            }
            if(this.nid_from!=null&&e.buttons==2){
                this.drawGraph()
            }
            if(this.lid_from!=null&&e.buttons==2){
                this.drawGraph()
            }
        },
        onMouseDown:function(e){
            if (e.buttons==2) this.stg_add=true
        },
        onMouseUp:function(e){
            if (this.stg_add) {
                this.stg_add=false
                let point=RN.addEle({name:'新点'})
                let data=[0.0,e.layerX,e.layerY,50,50]
                RN.addEleToGraph(point.nid,{geo:data})
                this.points[point.nid]=this.genPointData(point.nid)
                this.points[point.nid].stg_edit=true
                this.refreshCVS('ipt_point_'+point.nid)
            }
            if (this.nid_from!=null){
                let data=[0.0,e.layerX,e.layerY,50,50]
                let point=RN.addEle({name:'新点'})
                let link=RN.addEle({
                    desc:'新线',
                    start:[[parseInt(this.nid_from),-1]],
                    end:[[point.nid,-1]]},'link')
                RN.addEleToGraph(point.nid,{geo:data})
                this.links[link.lid]=this.genLinkData(link.lid)
                this.points[point.nid]=this.genPointData(point.nid)
                this.points[point.nid].stg_edit=true
                this.nid_from=null
                this.refreshCVS('ipt_point_'+point.nid)
            }else if (this.lid_from!=null){
                let data=[0.0,e.layerX,e.layerY,50,50]
                let point=RN.addEle({name:'新点'})
                let link=RN.linkEle(this.lid_from,point.nid)
                RN.addEleToGraph(point.nid,{geo:data})
                this.points[point.nid]=this.genPointData(point.nid)
                this.points[point.nid].stg_edit=true
                this.lid_from=null
                this.refreshCVS('ipt_point_'+point.nid)
            }
        },
        throttle:function(fn,gapTime){
            // 节流函数。
            let _this=this
            return function(){
                let _nowTime = +new Date()
                if (_nowTime-_this._lastTime>gapTime || !_this._lastTime){
                    fn(...arguments)// 函数可以带参数
                    _this._lastTime=_nowTime
                }
            }
        },
        onWheel:function (e) {
            e.stopPropagation()
            this.throttle(this.pageUpOrDown, 60)(e);
        },
        pageUpOrDown:function (e) {
            if (e.deltaY > 0) {
                console.log("正在向下")
            } else if (e.deltaY < 0) {
                console.log("正在向上")
            }
        },
        // Keyboard events.
        onESC:function(){
            this.stg_add=false
            this.nid_from=null
            this.lid_from=null
            let nids=Object.keys(this.points)
            for (let i = 0; i < nids.length; i++) {
                this.slctPoint(nids[i],false)
            }
        },
        onDel:function(){
            let pids=[]
            let lids=[]
            let pairs=Object.entries(this.points)
            for (let i = 0; i < pairs.length; i++) {
                if (pairs[i][1].stg_slct){
                    pids.push(pairs[i][0])
                    let ret=RN.delEle(pairs[i][0])
                    for (let j = 0; j < ret.length-1; j++) {
                        lids.push(ret[j].lid)
                    }
                }
            }
            for (let i = 0; i < pids.length; i++) {
                delete this.points[pids[i]]
            }
            pairs=Object.entries(this.links)
            for (let i = 0; i < pairs.length; i++) {
                if (pairs[i][1].stg_slct){
                    lids.push(pairs[i][0])
                    RN.delEle(pairs[i][0],'link')
                }
            }
            for (let i = 0; i < lids.length; i++) {
                delete this.links[lids[i]]
            }
            this.refreshCVS()
        },
        // Point.
        genPointData(pid){
            let geo=RN.getOverlay(pid).geo
            return {
                stg_slct:false,
                stg_over:false,
                stg_edit:false,
                'left':geo[1]-geo[3]/2+'px',
                'top':geo[2]-geo[4]/2+'px',
                'width':geo[3]+'px',
                'height':geo[4]+'px',
                'border-radius':geo[3]/2+'px',
                '--node_glow_color':'#fc9',
                '--node_glow_size':'0px',
            }
        },
        onDownPoint:function(pid){
            if (this.points[pid].stg_edit) return
            if (window.event.buttons==1) this.slctPoint(pid)
            else if(window.event.buttons==2) this.nid_from=pid
        },
        onDClickPoint:function(pid){
            if (this.points[pid].stg_edit) return
            this.points[pid].stg_edit=true
            this.refreshCVS('ipt_point_'+pid)

        },
        onMovePoint:function(pid){
            if (this.points[pid].stg_edit) return
            e=window.event
            if (this.ena_drag&&e.buttons==1){
                let x=parseInt(this.points[pid].left)+e.movementX
                let y=parseInt(this.points[pid].top)+e.movementY
                let ol=RN.getOverlay(pid)
                ol.geo=[0.0,x+ol.geo[3]/2,y+ol.geo[4]/2,ol.geo[3],ol.geo[4]]
                RN.setOverlay(pid,ol)
                this.points[pid].left=x+'px'
                this.points[pid].top=y+'px'
                let links=RN.getAroundLink(pid)
                let cmb=[...links[0],...links[1]]
                for (let i = 0; i < cmb.length; i++) {
                    this.links[cmb[i]]=this.genLinkData(cmb[i])
                }
                this.refreshCVS()
            }
        },
        onUpPoint:function(pid){
            if(this.nid_from!=null){
                let link=RN.linkEle(this.nid_from,pid)
                this.links[link.lid]=this.genLinkData(link.lid)
                this.nid_from=null
                this.links[link.lid].stg_edit=true
                this.refreshCVS('ipt_link_'+link.lid)
            }else if(this.lid_from!=null){
                let link=RN.linkEle(this.lid_from,pid)
                this.lid_from=null
                this.refreshCVS()
        }
        },
        onEnterPoint:function(pid){
            RN.setEle(pid,'name',document.getElementById('ipt_point_'+pid).value)
            this.onEscPoint(pid)
            v_save.stg_save=false
        },
        onEscPoint:function(pid){
            this.points[pid].stg_edit=false
            this.refreshCVS()
        },
        slctPoint(pid,stg=null){
            if (stg==null){
                this.points[pid].stg_slct=!this.points[pid].stg_slct
            }else{
                this.points[pid].stg_slct=stg
            }
            loop()
        },
        // Link.
        calcLinkMid:function(link){
            let gph=RN.getGraph()
            let snode=[]
            let enode=[]
            for(let j=0;j<link.start.length;j++){
                snode.push(RN.points[link.start[j][0]])}
            for(let j=0;j<link.end.length;j++){
                enode.push(RN.points[link.end[j][0]])}
            let sumx=0,sumy=0
            let arr_se=[...snode,...enode]
            for (let j = 0;j < arr_se.length;j++){
                sumx+=gph.overlay[arr_se[j].nid].geo[1]
                sumy+=gph.overlay[arr_se[j].nid].geo[2]
            }
            let midx=sumx/arr_se.length
            let midy=sumy/arr_se.length
            return [midx,midy,snode,enode]
        },
        genLinkData:function(lid){
            let link=RN.getEle(lid,'link')
            let geo=RN.getOverlay(lid).geo
            let arr=this.calcLinkMid(link)
            let tw=textWidth(link.desc)
            return {
                stg_slct:false,
                stg_over:false,
                stg_edit:false,
                'left':arr[0]+geo[1]-Math.max(tw/2,CH/100*2)+'px',
                'top':arr[1]+geo[2]-CH/100*2+'px',
                'width':tw+'px'
            }
        },
        slctLink:function(lid,stg=null){
            if (stg==null){
                this.links[lid].stg_slct=!this.links[lid].stg_slct
            }else{
                this.links[lid].stg_slct=stg
            }
            loop()
        },
        onUpLink:function(lid){
            if(this.nid_from!=null){
                let link=RN.linkEle(this.nid_from,lid)
                this.nid_from=null
                this.refreshCVS()
            }else if(this.lid_from!=null){
                this.lid_from=null
            }
        },
        onDownLink:function(lid){
            if (this.links[lid].stg_edit) return
            if (window.event.buttons==1) this.slctLink(lid)
            else if(window.event.buttons==2) this.lid_from=lid
        },
        onDClickLink:function(lid){
            if (this.links[lid].stg_edit) return
            this.links[lid].stg_edit=true
            this.refreshCVS('ipt_link_'+lid)

        },
        onMoveLink:function(lid){
            if (this.links[lid].stg_edit) return
            e=window.event
            if (this.ena_drag&&e.buttons==1){
                let x=parseInt(this.links[lid].left)+e.movementX
                let y=parseInt(this.links[lid].top)+e.movementY
                let tw=textWidth(RN.links[lid].desc)
                let ol=RN.getOverlay(lid)
                ol.geo=[0.0,
                    ol.geo[1]+e.movementX,
                    ol.geo[2]+e.movementY]
                RN.setOverlay(lid,ol)
                this.links[lid].left=x+'px'
                this.links[lid].top=y+'px'
                this.refreshCVS()
            }
        },
        onEnterLink:function(lid){
            RN.setEle(lid,'desc',document.getElementById('ipt_link_'+lid).value)
            this.onEscLink(lid)
            v_save.stg_save=false
        },
        onEscLink:function(lid){
            this.links[lid].stg_edit=false
            this.refreshCVS()
        },
    }
})
var v_splash=new Vue({
    el:'#div_splash',
    data:{
        visible:true,
        tips:[]
    }
})
var v_netname=new Vue({
    el:'#div_netname',
    data:{netname:''}
})
// 文件
var v_new=new Vue({
    el:"#btn_new",
    methods:{
        newNet:function(){
            var request = new XMLHttpRequest()
            request.open("get", "template/default.json")
            request.send(null)
            request.onload = function () {
                if (request.status == 200) {
                    RN=new RNet()
                    RN.loadRNet(JSON.parse(request.responseText))
                    V_CVS.newNet(RN)
                }
            }
        }
    }
})
var v_open=new Vue({
    el:'#btn_open',
    methods:{
        onClickOpen:function(e){this.$refs.ipt_open.click()},
    }
})
function onOpenChange(e){
    let file=e.target.files[0]
    let reader = new FileReader()// 新建一个FileReader
        reader.readAsText(file, 'UTF-8')// 读取文件
        reader.onload = function (evt) { // 读取完文件之后会回来这里
            let context = evt.target.result // 读取文件内容
            RN=new RNet()
            RN.loadRNet(JSON.parse(context))
            V_CVS.newNet(RN)
        }
}
var v_save=new Vue({
    el:'#btn_save',
    data:{
        stg_save:true
    },
    methods:{
        onClick:function(){
            this.stg_save=true

        }
    },
    computed:{
        text(){
            if (!this.stg_save) return '*'
            else return ''
        }
    }
})
var v_export=new Vue({
    el:'#btn_export',
    data:{
    },
    methods:{
        onClick:function(){
            if(!V_CVS.net.hasOwnProperty('name')) return
            let eleLink = document.createElement("a")
            eleLink.download = V_CVS.net.name+'.json'
            eleLink.style.display = "none"
            let data = JSON.stringify(V_CVS.net, undefined)
            let blob = new Blob([data], { type: "text/json" })
            eleLink.href = URL.createObjectURL(blob)
            document.body.appendChild(eleLink)
            eleLink.click()
            document.body.removeChild(eleLink)
        }
    }
})
// 排列
var v_ctr=new Vue({
    el:'#btn_ctr',
    methods:{
        onClick:function(){
            RN.arrangeCenter()
            V_CVS.genCVSData()
            V_CVS.refreshCVS()
        }
    }
})
// 开关
var v_free=new Vue({
    el:'#ipt_free',
    data:{ena_free:false}
})
var v_align=new Vue({
    el:'#ipt_align',
    data:{ena_align:true}
})

// P5.
function setup() {createCanvas(0.75*CW-0.04*CH, 0.89*CH)}
function draw() {
    if (!V_CVS.net.hasOwnProperty('name')) return
    V_CVS.drawGraph()
    noLoop()
}
