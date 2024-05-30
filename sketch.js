const vectors = 35;
const extraVectors = 2
let xDrop, yDrop
let pressed = false
let message = true

let slider, check1, check2
let arrow;
const matrix = []
let charges = []
let draggingCharge


function setup() {
  frameRate(10)
  const canvas = createCanvas(700, 700)
  angleMode(DEGREES)

  //gerar grid de vetores
  const vectorW = int(width / vectors)
  const vectorH = int(height / vectors)

  yDrop = -vectorH * extraVectors

  for (let i = 0; i < vectors + 2 * extraVectors; i++) {
    const rows = []
    matrix.push(rows)

    xDrop = -vectorW * extraVectors
    for (let j = 0; j < vectors + 2 * extraVectors; j++) {
      rows.push(new vector(xDrop, yDrop))
      xDrop += vectorW
    }
    yDrop += vectorH
  }


  //limpar tela
  const trash = createButton("Apagar")
  trash.position(width - 80, height + 20)
  trash.mousePressed(() => {
    charges.length = 0
    message = false
  })
  
  // valores de carga
  slider = createSlider(50, 125, 75)
  check1 = createCheckbox("Positiva", true)
  check1.changed(checkVerification)
  check2 = createCheckbox("Negativa", false)
  check2.changed(checkVerification)
  
  //criar carga elétrica
  canvas.mouseClicked(() => {
    if (charges.length >= 7 || pressed || message) {
      pressed = false
      return;
    }
    charges.push(new charge(mouseX, mouseY, chargeMass, cation))
  });
}

function draw() {
  if (message) {
    background(30)
    fill(255)
    textSize(30)
    textAlign(CENTER)
    text(`Pressione para posicionar uma carga\n Arraste para simular uma carga`, width/2, height/2)
    textSize(18)
    text("Aperte 'Apagar' para limpar a tela", width/2, height - 100)
  } else {
    background(230)
    fill("black")
    chargeMass = slider.value()
    cation = check1.checked()
    anion = check2.checked()
    textSize(20)
    textAlign(LEFT)
    fill("purple")
    text(`Massa: ${chargeMass}  carga: ${cation ? "Positiva" : "Negativa"}`, 0, height - 5)

    matrix.forEach((rows) => {
      rows.forEach((vector) => {
        vector.direction()
        vector.magnitude()
      });
    });

    charges.forEach((charge) => {
      charge.position()
    });
  }
}

function mousePressed() {
  if (mouseX > width || mouseY > height || message) { return }
  draggingCharge = new charge(mouseX, mouseY, chargeMass, cation)
  charges.push(draggingCharge)
}
function mouseDragged() {
  if (draggingCharge == undefined || message) { return }
  pressed = true
  draggingCharge.x = mouseX
  draggingCharge.y = mouseY
}
function mouseReleased() {
  const index = charges.indexOf(draggingCharge)
  if (index > -1) { charges.splice(index, 1) }
  draggingCharge = undefined
}

class charge {
  constructor(x, y, mass, positive) {
    this.x = x
    this.y = y
    this.mass = mass
    this.positive = positive
    this.color = positive ? "#D83838" : "#4242EE"
  }

  position() {
    noStroke()
    fill(this.color)
    circle(this.x, this.y, map(this.mass, 50, 125, 20, 40))
  }
}


class vector {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.force = 0
    this.graus = 0
  }

  direction() {
    //calcular a direção e força da interação elétrica
    if(charges.length == 0) {
      this.force = 0
      this.graus = 0
      return 
    }
    
    const K = 1000
    let xTotal = 0
    let yTotal = 0
    
    charges.forEach(Q => {
      //lei de coulomb: E = (k*Q*q)/d**2
      //E: força elétrica; k: constante de coulomb; Q, q: carga elétrica e de teste; d: distância
      const deltaX = Q.x - this.x
      const deltaY = Q.y - this.y
      this.graus = atan2(deltaY, deltaX)
      let d = sqrt(deltaX**2 + deltaY**2)
      
      let E = Q.positive ? -(K*Q.mass)/d**2 : (K*Q.mass)/d**2
      
      //calcular força total em cada eixo
      xTotal += E * cos(this.graus)
      yTotal += E * sin(this.graus)
    })
                             
    this.force = sqrt(xTotal**2 + yTotal**2) * 2 //* 2 apenas para aumentar a escala dos vetores
    this.graus = atan2(yTotal, xTotal)
    
    this.force = this.force > 100 ? 100 : this.force
  }

  magnitude() {
    //mudar o tamanho e transparencia de acordo com a magnitude da força
    push()
    translate(this.x, this.y)
    rotate(this.graus)
    scale(map(this.force, 0, 100, 0.6, 1.4))
    fill(map(this.force, 0, 100, 60, 10))
    rect(0, -1, 10, 1)
    triangle(10, -3, 10, 3, 13, 0)
    pop()
  }
}

function checkVerification() {
  if (
    (check1.checked() && check2.checked()) ||
    (!check1.checked() && !check2.checked())
  ) {
    if (this == check1) {
      check1.checked(true)
      check2.checked(false)
    } else {
      check1.checked(false)
      check2.checked(true)
    }
  }
}
