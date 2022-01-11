/*****************************************************************************************/
// Molecule
/*****************************************************************************************/
function MoleculeFlash(pars) {
    this.i = pars.i;
    
    this.angles = [0, 0, 0]; 
    this.points = [];
    
    this.atoms = [];
    this.bonds = [];
    
    this.draw_atoms = pars.draw_atoms;
    this.draw_bonds = pars.draw_bonds;
    
    this.atom_colors = pars.atom_colors;
    this.glow = pars.glow;
    
    this.width = 400;
    this.height = 380;
    
    this.autorotation = [0,0,0]; // Autorotation around x,y,z axes
    this.timeout_id = -1;
    
    this.render = function() {
        render_molecule_flash(this.i);
    }
        
    this.reset_model = function() {
        var bb = bbox(this.atoms);
        
        // center model (middle of bounding box)
        var cx = bb.x[0]+(bb.x[1]-bb.x[0])/2.0;
        var cy = bb.y[0]+(bb.y[1]-bb.y[0])/2.0;
        var cz = bb.z[0]+(bb.z[1]-bb.z[0])/2.0;
        translate(this.atoms, -cx,-cy,-cz);
        
        // scale model (fit in canvas)
        var max_model = Math.max(bb.x[1]-bb.x[0], bb.y[1]-bb.y[0]);
        var min_canvas = Math.min(this.width, this.height);
        var scale = 0.8*min_canvas/max_model;
        rescale(this.atoms, scale);
        
        // copy original atom locations
        this.points = array2d(this.atoms.length, 4);
        for(var i=0; i<this.atoms.length; i++) {
            this.points[i][0] = this.atoms[i][0];
            this.points[i][1] = this.atoms[i][1];
            this.points[i][2] = this.atoms[i][2];
            this.points[i][3] = this.atoms[i][3];
        }
        rotate(this.atoms, this.points, this.angles);
           
        this.reset_flash();
    }
    
    this.reset_flash = function() {
        var px = [];
        var lx = [];
        var cx = [];
        var chex = 0;
        
        for(var i=0; i<this.points.length; i++) {
            px.push(this.points[i][0]);
            px.push(this.points[i][1]);
            px.push(this.points[i][2]);
            
            chex = 0x010000*this.points[i][3][0] + 0x000100*this.points[i][3][1] + 0x000001*this.points[i][3][2];
            cx.push(chex);
        }

        for(var i=0; i<this.bonds.length; i++) {
            lx.push(this.bonds[i][0]);
            lx.push(this.bonds[i][1]);
        }
        
        reset_molecule_flash(this.i, px, lx, cx);
        toggle_atoms_flash(this.i, this.draw_atoms);
        toggle_bonds_flash(this.i, this.draw_bonds);
        toggle_colors_flash(this.i, this.atom_colors);
        toggle_glow_flash(this.i, this.glow);
    }
    
    this.update_rotations_flash = function() {
        rotate_molecule_flash(this.i, this.angles);
    }
    
    this.process_sdf = function(data) {
        var result = parse_sdf(data);
        if(result.ok) {
            this.atoms = result.atoms;
            this.bonds = result.bonds;
            
            this.reset_model();
            this.render();
        }
    }
    
    this.process_pdb = function(data) {
        var result = parse_pdb(data);
        if(result.ok) {
            this.atoms = result.atoms;
            this.bonds = result.bonds;
            
            this.reset_model();
            this.render();
        }
    }
    
    this.toggle_autorotation = function(axis, what) {
        toggle_autorotation_flash(this.i, axis);
    }
    
    this.toggle_atoms = function() {
        this.draw_atoms = !this.draw_atoms;
        toggle_atoms_flash(this.i, this.draw_atoms);
        this.render();
    }
    
    this.toggle_bonds = function() {
        this.draw_bonds = !this.draw_bonds;
        toggle_bonds_flash(this.i, this.draw_bonds);
        this.render();
    }
    
    this.toggle_color = function() {
        this.atom_colors = !this.atom_colors;
        toggle_colors_flash(this.i, this.atom_colors);
        this.render();
    }

    this.toggle_glow = function() {
        this.glow = !this.glow;
        toggle_glow_flash(this.i, this.glow);
        this.render();
    }
    
    this.toggle_autorotation_x = function() {
        this.toggle_autorotation(0, this);
    }
    
    this.toggle_autorotation_y = function() {
        this.toggle_autorotation(1, this);
    }
    
    this.toggle_autorotation_z = function() {
        this.toggle_autorotation(2, this);
    }
    
    this.destruct = function() {
    }
}

/*****************************************************************************************/
// HTML rendering
/*****************************************************************************************/
function add_molecule_flash(label, name, text) {
    var i = M_COUNTER;
    M_COUNTER++;
    
    function delayed_init() {
        var pars = PARS[get_type(name)]; 
        pars.i = i;        
        var molecule = new MoleculeFlash(pars);

        // have to do it ugly way as Explorer barfs on "bind"
        if(text) {
            var ext = guess_type(text);
            if(ext=="pdb")
                molecule.process_pdb(text);
            else
                molecule.process_sdf(text);
            
        }
        else {
            var url = "data/"+name;
            var ext = name.substr(name.length-3, 3);
            if(ext=="pdb")
                ajax_load(url, "txt", function(text) { molecule.process_pdb(text) });
            else
                ajax_load(url, "txt", function(text) { molecule.process_sdf(text) });
        }
        
        var parent = $("#screen"+i);
        var header = '<span class="close">X</span>'+label+'<span class="stats">X atoms Y bonds Z FPS</span>';
        parent.children(".dragheader").html(header);
        
        
        if(pars.draw_atoms) parent.children(".b_atoms").addClass("on");
        if(pars.draw_bonds) parent.children(".b_bonds").addClass("on");
        
        if(pars.bonds_autowidth) parent.children(".b_width").addClass("on");
        if(pars.bonds_gradient)  parent.children(".b_grad").addClass("on");
        if(pars.atom_colors)     parent.children(".b_col").addClass("on");
        if(pars.glow)            parent.children(".b_glow").addClass("on");
        
        if(pars.auto_x) {
            parent.children(".b_x").addClass("on");
            molecule.toggle_autorotation(0, molecule);
        }
        if(pars.auto_y) {
            parent.children(".b_y").addClass("on");
            molecule.toggle_autorotation(1, molecule);
        }
        if(pars.auto_z) {
            parent.children(".b_z").addClass("on");
            molecule.toggle_autorotation(2, molecule);
        }
        
        // need to stop wheel event also in JS to prevent page scrolling as eating up wheel event in Flash is not enough
        $(".molecule").mousewheel( function(e,d) { e.stopPropagation(); e.preventDefault(); } );
        
        $(".molecule").draggable();
        
        parent.children(".b_bonds").click( bind(molecule, molecule.toggle_bonds ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });
        parent.children(".b_atoms").click( bind(molecule, molecule.toggle_atoms ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });
            
        parent.children(".b_x").click( bind(molecule, molecule.toggle_autorotation_x ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });
        parent.children(".b_y").click( bind(molecule, molecule.toggle_autorotation_y ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });
        parent.children(".b_z").click( bind(molecule, molecule.toggle_autorotation_z ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });

        parent.children(".b_col").click( bind(molecule, molecule.toggle_color ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });        
        
        parent.children(".b_glow").click( bind(molecule, molecule.toggle_glow ) ).toggle( function() { $(this).toggleClass("on") }, function() { $(this).toggleClass("on") });        
        
        parent.children(".dragheader").children(".close").click( function() {
            parent.remove();
            
            molecule.destruct();
            delete molecule;
        });
    }
    
    create_screen_flash(i, function() { delayed_init() });    
    //setTimeout(delayed_init, 300);
}

/*****************************************************************************************/
// Main
/*****************************************************************************************/
$(document).ready(function(){
});