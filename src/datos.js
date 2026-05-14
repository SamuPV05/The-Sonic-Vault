export const DATA_ARTISTAS = {
    "michael-jackson": {
      nombre: "Michael Jackson",
      subtitulo: "The King of Pop",
      bio: "El artista más premiado y exitoso de la historia. Con un talento inigualable para el baile y la composición, Michael definió el sonido de los años 80 y 90. Su disco 'Thriller' sigue siendo el álbum más vendido de todos los tiempos. La Bóveda rinde tributo al Rey eterno.",
      imagen: "https://i8.amplience.net/i/naras/michael-jackson_MI0003641483-MN0000467203",
      eras: [
        { 
            año: "1979", 
            titulo: "La Revolución del Disco", 
            descripcion: "Con 'Off the Wall', Michael dejó atrás la era de los Jackson 5 para demostrar que podía dominar la escena solista. Una mezcla perfecta de funk, disco y baladas sofisticadas producidas por Quincy Jones.", 
            img: "https://upload.wikimedia.org/wikipedia/en/f/f6/Off_the_wall.jpg",
            stems: [
              { titulo: "Don't Stop 'Til You Get Enough", tieneDesensamblador : true, rutaStems: "/stems/dont-stop" }, "Rock with You", "Workin' Day and Night", "Get on the Floor", "Off the Wall", "Girlfriend", "She's Out of My Life", "I Can't Help It", "It's the Falling in Love", "Burn This Disco Out"] 
        },
        { 
            año: "1982", 
            titulo: "Dominación Mundial", 
            descripcion: "El fenómeno 'Thriller'. Con este álbum, Michael se convirtió en la persona más famosa del planeta. Nueve pistas, siete éxitos en el Top 10 y el nacimiento del Moonwalk. Aquí es donde el pop alcanzó su forma final.", 
            img: "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png",
            stems: ["Wanna Be Startin' Somethin'", "Baby Be Mine", "The Girl Is Mine", "Thriller","Beat It", { titulo: "Billie Jean", tieneDesensamblador: true, rutaStems: "/stems/billie-jean" }, "Human Nature", "P.Y.T. (Pretty Young Thing)", "The Lady in My Life"]
        },
        { 
            año: "1987", 
            titulo: "La Perfección Sónica", 
            descripcion: "En 'Bad', Michael tomó un control creativo casi total. Un sonido más industrial, letras más crudas y una gira mundial que redefinió lo que significa ser una superestrella global.", 
            img: "https://upload.wikimedia.org/wikipedia/en/5/51/Michael_Jackson_-_Bad.png",
            stems: ["Bad", "The Way You Make Me Feel", "Speed Demon", "Liberian Girl", "Just Good Friends", "Another Part of Me", "Man in the Mirror", "I Just Can't Stop Loving You", "Dirty Diana", { titulo: "Smooth Criminal", tieneDesensamblador : true, rutaStems: "/stems/smooth-criminal" }, "Leave Me Alone"]
        },
        {  
            año: "1991", 
            titulo: "El Maestro de lo Visual", 
            descripcion: "Con 'Dangerous', Jackson abrazó el New Jack Swing. Fue una era marcada por cortometrajes ambiciosos, un mensaje social más fuerte y una experimentación rítmica que todavía suena moderna hoy.", 
            img: "https://i.ebayimg.com/images/g/-VIAAOSwIvFhWGuJ/s-l400.jpg",
            stems: ["Jam", "Why You Wanna Trip on Me", "In The Closet", "She Drives Me Wild", { titulo: "Remember The Time", tieneDesensamblador: true, rutaStems: "/stems/remember-the-time" }, "Can't Let Her Get Away", "Heal The World", "Black or White", "Who Is It", "Give In to Me", "Will You Be There", "Keep the Faith", "Gone Too Soon", "Dangerous"] 
        }
      ],
      ecos: [
        { id: "bruno-mars", relacion: "El Legado del Pop", tipo: "Inspiró a" },
        { id: "kendrick-lamar", relacion: "Impacto Cultural", tipo: "Rompiendo Barreras" }
      ]
    },
    "bruno-mars": {
      nombre: "Bruno Mars",
      subtitulo: "El Arquitecto del Groove Moderno",
      bio: "Conocido por sus actuaciones electrizantes y su impecable estilo retro, Bruno Mars es uno de los artistas más exitosos de su generación. No solo hace música; revive eras enteras con una precisión milimétrica.",
      imagen: "https://i.pinimg.com/736x/20/0b/1a/200b1ad6a115acb72f71fe39f63fffa4.jpg",
      eras: [
        { 
            año: "2010", 
            titulo: "El Chico de los Coros", 
            descripcion: "Antes del estrellato, Bruno era un escritor fantasma. 'Doo-Wops & Hooligans' lo puso en el mapa mezclando reggae, pop y letras románticas que definieron una década.", 
            img: "https://storage.highresaudio.com/library/bild/c_640000/647328/field4.jpg",
            stems: ["Grenade", "Just The Way You Are", "Our First Time", { titulo: "Runaway Baby", tieneDesensamblador: true, rutaStems: "/stems/runaway-baby" }, "The Lazy Song", "Marry You", "Talking To The Moon", "Liquor Store Blues", "Count on Me", "The Other Side", "Somewhere in Brooklyn"]
        },
        { 
            año: "2012", 
            titulo: "La Jukebox Impredecible", 
            descripcion: "Con 'Unorthodox Jukebox', Mars rompió las etiquetas. Desde el reggae-rock de 'Locked Out of Heaven' hasta las baladas desgarradoras, demostró que podía dominar cualquier frecuencia del espectro sonoro.", 
            img: "https://i.scdn.co/image/ab67616d0000b273926f43e7cce571e62720fd46",
            stems: ["Young Girls", "Locked out of Heaven", "Gorilla", { titulo: "Treasure", tieneDesensamblador: true, rutaStems: "/stems/treasure" }, "Moonshine", "When I Was Your Man", "Natalie", "Show Me", "Money Make Her Smile", "If I Knew"]
        },
        { 
            año: "2016", 
            titulo: "La Inmersión en los 90s", 
            descripcion: "Con '24K Magic', Bruno no hizo un homenaje, construyó una máquina del tiempo. Sintetizadores pesados y cajas de ritmos Roland lo coronaron como el rey de la pista.", 
            img: "https://cdn-images.dzcdn.net/images/cover/012b27906b430a37ec1d8f793d5c4fa6/0x1900-000000-80-0-0.jpg",
            stems: ["24K Magic", "Chunky", "Perm", "That's What I Like", "Versace on the Floor", "Straight up & Down", "Calling All My Lovelies", "Finesse", "Too Good to Say Goodbay"]
        },
        { 
            año: "2021", 
            titulo: "An Evening With Silk Sonic", 
            descripcion: "Junto a Anderson .Paak, Bruno alcanzó la perfección del Soul. Un proyecto donde el terciopelo y el funk setentero se fusionan en una experiencia auditiva impecable y sofisticada.", 
            img: "https://i.scdn.co/image/ab67616d0000b2735f19f50677f8ded7021b8229",
             stems: ["Silk Sonic Intro", { titulo: "Leave The Door Open", tieneDesensamblador: true, rutaStems: "/stems/leave-the-door-open" }, "Fly As Me", "After Last Night", "Smokin Out The Window", "Put On A Smile", "777", "Skate", "Love's Train", "Blast Off"]
        },
        { 
            año: "2026", 
            titulo: "El Regreso al Romance", 
            descripcion: "Tras una década en solitario, 'The Romantic' aterriza despojándose de lo comercial para entregar baladas crudas y arreglos orquestales en vivo.", 
            img: "https://i.scdn.co/image/ab67616d0000b2731cc6f24606517f854014ca69",
            stems: ["Risk It All", "Cha Cha Cha", { titulo: "I Just Might", tieneDesensamblador: true, rutaStems: "/stems/i-just-might" }, "God Was Showing Off", "Why You Wanna Fight?", "On My Soul", "Something Serious", "Nothing Left", "Dance With Me"]
        }
      ]
      ,
      ecos: [
        { id: "michael-jackson", relacion: "Heredero del Groove", tipo: "Influencia Directa" },
        { id: "billie-eilish", relacion: "La Antítesis del Pop", tipo: "Contraste Sonoro" },
        { id: "lady-gaga", relacion: "Voces de otra época", tipo: "Colaboración Histórica" }
      ]
    },
    "kendrick-lamar": {
      nombre: "Kendrick Lamar",
      subtitulo: "Pulitzer Rap & West Coast King",
      bio: "El maestro lírico de Compton. Kendrick no solo hace música, hace literatura sonora. Es el primer artista de rap en ganar un Premio Pulitzer de Música, demostrando que el hip-hop es la herramienta de narrativa social más poderosa del siglo.",
      imagen: "https://people.com/thmb/i6c3G3AXGNSjcGGFQH1qT1txIOk=/4000x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(739x252:741x254)/kendrick-lamar-super-bowl-lix-halftime-show-new-orleans-021025-d475390879514d9bbcc5f21f79814ecb.jpg",
      eras: [
        { 
            año: "2012", 
            titulo: "El Relato de Compton", 
            descripcion: "Con 'good kid, m.A.A.d city', Kendrick entregó un cortometraje en formato de audio. Una narrativa cruda y cinematográfica sobre sobrevivir a la cultura de las pandillas en Los Ángeles, consolidándolo como el nuevo rey del Oeste.", 
            img: "https://upload.wikimedia.org/wikipedia/en/thumb/9/93/KendrickGKMC.jpg/250px-KendrickGKMC.jpg",
            stems: ["Sherane a.k.a Master Splinte's Daughter", "Bitch, Don't Kill My Vibe", "Backseat Freestyle", "The Art of Peer Pressure", "Money Trees", "Poetic Justice", "good kid", "m.A.A.d city", "Swimming Pools (Drank)", "Sing About Me, I'm Dying Of Thirst", "Real", "Compton"]
        },
        { 
            año: "2015", 
            titulo: "La Obra Maestra del Jazz-Rap", 
            descripcion: "'To Pimp a Butterfly' rompió todas las reglas comerciales. Una colisión caótica de free-jazz, funk de los 70s y poesía hablada que se convirtió en la banda sonora de los movimientos por los derechos civiles modernos.", 
            img: "https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png",
            stems: ["Wesley's Theory", "Institutionalized", "These Walls", "Mortal Man"]
        },
        { 
            año: "2017", 
            titulo: "La Letra Escarlata", 
            descripcion: "'DAMN.' fue un golpe a la mandíbula. Beats pesados, barras afiladas y una introspección sobre la religión y el destino que le valió el Premio Pulitzer de Música, haciendo historia en el género.", 
            img: "https://upload.wikimedia.org/wikipedia/en/5/51/Kendrick_Lamar_-_Damn.png" ,
            stems: ["BLOOD.", "DNA.", "LOYALTY.", "HUMBLE.", "FEAR.", "DUCKWORTH."]
        },
        { 
            año: "2022", 
            titulo: "La Terapia Cruda", 
            descripcion: "Tras un largo silencio, 'Mr. Morale & the Big Steppers' desnudó la psique del artista. Un álbum doble y teatral donde Kendrick renuncia a su rol de 'salvador' para enfrentar el trauma generacional.", 
            img: "https://cdn-images.dzcdn.net/images/cover/412361ce41f0bd2595978dbf0e035ad3/1900x1900-000000-80-0-0.jpg",
            stems: ["United In Grief", "N95", "Worldwide Steppers", "Die Hard", "Savior", "Mr. Morale", "Mirror"]
        }
      ],
      ecos: [
        { id: "michael-jackson", relacion: "El Peso de la Corona", tipo: "Referencia Histórica" },
        { id: "billie-eilish", relacion: "La Oscuridad Contemporánea", tipo: "Contraste Generacional" }
      ]
    },
    "billie-eilish": {
      nombre: "Billie Eilish",
      subtitulo: "Dark Alt-Pop & ASMR Vocals",
      bio: "La voz de una generación ansiosa. Billie Eilish redefinió el pop comercial grabando en su habitación junto a su hermano Finneas. Con su estilo vocal susurrado y bases que retumban en el pecho, su sonido es melancólico, oscuro y totalmente hipnótico.",
      imagen: "https://akamai.sscdn.co/uploadfile/letras/fotos/c/3/5/3/c3536a6c436d0dd65a500dfa8b6bd7fb.jpg",
      eras: [
        { 
            año: "2017", 
            titulo: "El Ascenso Viral", 
            descripcion: "Con el EP 'Don't Smile at Me', Billie pasó de ser un secreto de SoundCloud a un fenómeno global. Letras adolescentes con una madurez perturbadora y bases minimalistas que sentaron las bases de su imperio.", 
            img: "https://cdn-images.dzcdn.net/images/cover/c6e5ffd676146c447a4a81819c5d29ae/0x1900-000000-80-0-0.jpg",
            stems: ["COPYCAT", "my boy", "watch", "ocean eyes", "&burn"] 
        },
        { 
            año: "2019", 
            titulo: "La Pesadilla Pop", 
            descripcion: "'When We All Fall Asleep, Where Do We Go?' lo cambió todo. Un disco de pop que suena a película de terror, lleno de bajos distorsionados y voces superpuestas que barrió con los premios Grammy.", 
            img: "https://media.pitchfork.com/photos/63b2f94e198393ca23dbcb83/master/pass/Billie-Eilish.jpg",
            stems: ["bad guy", "you should see me in a crown", "all the good girls go to hell", "my strange addiction", "bury a friend"]
        },
        { 
            año: "2021", 
            titulo: "La Melancolía Dorada", 
            descripcion: "En 'Happier Than Ever', Billie abandonó el verde neón por un rubio clásico, entregando un álbum que reflexiona sobre el peso de la fama y el abuso, mezclando bossa nova, jazz y pop-punk.", 
            img: "https://akamai.sscdn.co/letras/360x360/albuns/9/c/9/1/2190341713277478.jpg",
            stems: ["Getting Older", "my future", "NDA", "Therefore I Am", "Happier Than Ever"]
        },
        { 
            año: "2024", 
            titulo: "El Retorno Sintético", 
            descripcion: "'Hit Me Hard and Soft' es un viaje de regreso a la oscuridad, pero con una producción mucho más rica. Cuerdas cinematográficas chocan contra sintetizadores agresivos en su trabajo más maduro hasta la fecha.", 
            img: "https://storage.highresaudio.com/2024/05/17/tfaizq-hitmeharda-preview-m3.jpg",
            stems: ["SKINNY", "LUNCH", "BIRDS OF A FEATHER", "L'AMOUR DE MA VIE", "BLUE"]
        }
      ],
      ecos: [
        { id: "bruno-mars", relacion: "La Antítesis del Pop", tipo: "Contraste Sonoro" },
        { id: "kendrick-lamar", relacion: "Narrativas Oscuras", tipo: "Paralelo Creativo" },
        { id: "lana-del-rey", relacion: "Admiración e inspiración", tipo: "Influencia Directa"}
      ]
    },
    "lana-del-rey": {
      nombre: "Lana Del Rey",
      subtitulo: "Reina Del Alternativo",
      bio: "Lana Del Rey ha sido definida desde los inicios de su carrera como una artista dirruptiva e innovadora en su entorno musical. En 2021 obtuvo el premio de 'Artista De La Decada' por la famosa revista Variety. ",
      imagen: "https://i.pinimg.com/564x/14/99/0b/14990b0c46e7fbed47aeae59a5734433.jpg",
      eras: [
        { 
            año: "2012", 
            titulo: "El Nacimiento del Sadcore", 
            descripcion: "Con 'Born To Die', Lana introdujo al mundo a un ícono instantáneo. Orquestaciones cinematográficas chocan con beats de hip-hop, creando himnos de amor fatalista y nostalgia americana.", 
            img: "https://www.lamusica.com.co/cdn/shop/products/LanaDelRey_BornToDie.jpg?v=1594219786",
            stems: ["Video Games", "Born To Die", "Blue Jeans", "Summertime Sadness", "National Anthem"]
        },
        { 
            año: "2014", 
            titulo: "El Descenso al Rock", 
            descripcion: "Producido por Dan Auerbach, 'Ultraviolence' abandonó el pop pulido por guitarras saturadas, jazz oscuro y una atmósfera densa de la Costa Oeste de los años 70.", 
            img: "https://i.scdn.co/image/ab67616d0000b2731624590458126fc8b8c64c2f",
            stems: ["Cruel World", "Ultraviolence", "West Coast", "Sad Girl", "Florida Kilos"] 
        },
        { 
            año: "2019", 
            titulo: "La Gran Novela Americana", 
            descripcion: "Considerada su obra maestra. 'Norman Fucking Rockwell!' es un álbum acústico y expansivo donde Lana se convierte en la poeta laureada del apocalipsis californiano.", 
            img: "https://i.scdn.co/image/ab67616d0000b273879e9318cb9f4e05ee552ac9",
            stems: ["Norman fucking Rockwell", "Mariners Apartment Complex", "Venice Bitch", "The greatest"]
        },
        { 
            año: "2023", 
            titulo: "La Introspección", 
            descripcion: "En 'Did you know that there's a tunnel under Ocean Blvd', Lana explora su linaje y la memoria con arreglos de piano desnudos, coros gospel y un tono casi conversacional.", 
            img: "https://i.scdn.co/image/ab67616d0000b27359ae8cf65d498afdd5585634",
            stems: ["The Grants", "Sweet", "A&W", "Fingertips", "Fishtail", "Peppers"]
        }
      ],
      ecos: [
        // La conectamos con Billie porque Billie ha dicho múltiples veces que Lana es su mayor inspiración
        { id: "billie-eilish", relacion: "Heredera de la Melancolía", tipo: "Inspiró a" },
        { id: "the-weeknd", relacion: "Starboy & Stargirl", tipo: "Almas Gemelas Musicales"}
      ]
    },
    "eminem": {
      nombre: "Eminem",
      subtitulo: "Rap God & Alter Egos",
      bio: "Marshall Mathers redefinió el hip-hop global con su lirismo implacable, su humor oscuro y la creación de su infame alter ego, Slim Shady. Una narrativa de superación, controversia y dominio técnico absoluto del micrófono que lo coronó como leyenda.",
      imagen: "https://img.redbull.com/images/c_crop,x_0,y_0,h_599,w_479/c_fill,w_450,h_600/q_auto,f_auto/redbullcom/2017/11/30/a6a221ac-cf00-4e7d-b983-9219dfeaddec/eminem",
      eras: [
        { 
            año: "1999", 
            titulo: "El Nacimiento de Slim Shady", 
            descripcion: "Con 'The Slim Shady LP', el mundo conoció a un villano rubio platinado de Detroit. Rimas provocadoras, humor negro y un flow imparable apadrinado por Dr. Dre que sacudió la cultura pop.", 
            img: "https://upload.wikimedia.org/wikipedia/en/3/35/Eminem_-_The_Slim_Shady_LP_CD_cover.jpg",
            stems: ["My Name Is", "Role Model", "Guilty Conscience"]
        },
        { 
            año: "2002", 
            titulo: "El Show de Marshall Mathers", 
            descripcion: "'The Eminem Show' muestra al artista en la cima del mundo. Un disco más maduro y personal donde reflexiona sobre el peso de la fama, su familia y su rol como el centro de atención de América.", 
            img: "https://upload.wikimedia.org/wikipedia/en/3/35/The_Eminem_Show.jpg",
            stems: ["Without Me", "Sing for the Moment", "Cleanin' Out My Closet", "'Till I Collapse"]
        },
        { 
            año: "2010", 
            titulo: "El Renacer", 
            descripcion: "En 'Recovery', Eminem abandona los alter egos para enfrentar sus demonios internos y la superación de sus adicciones, entregando himnos de estadio llenos de fuerza, resiliencia y redención.", 
            img: "https://upload.wikimedia.org/wikipedia/en/6/60/Recovery_Album_Cover.jpg",
            stems: ["Cold Wind Blows", "On Fire", "Not Afraid", "Seduction", "Love The Way You Lie"]
        },
        { 
            año: "2020", 
            titulo: "El Asesino Lírico", 
            descripcion: "'Music to Be Murdered By', inspirado en el suspenso de Alfred Hitchcock, consolida su estatus de leyenda veterana, demostrando velocidades y esquemas de rimas inalcanzables para la nueva escuela.", 
            img: "https://upload.wikimedia.org/wikipedia/en/8/80/Eminem_-_Music_to_Be_Murdered_By.png",
            stems: ["Godzilla", "Darkness", "Those Kinda Nights", "Lock It Up", "Farewell", "No Regrets"]
        }
      ],
      ecos: [
        { id: "dr-dre", relacion: "El Maestro y el Prodigio", tipo: "Mentor y Productor" },
        { id: "rihanna", relacion: "Colisiones de Estadio", tipo: "Colaboradora Frecuente" }
      ]
    },
    "rihanna": {
      nombre: "Rihanna",
      subtitulo: "Icono Global & R&B Vanguardista",
      bio: "Desde sus raíces caribeñas hasta convertirse en una magnate de la moda y la música, Rihanna ha dictado las tendencias del pop, el dance y el R&B durante más de una década con una actitud inquebrantable y un tono vocal inconfundible.",
      imagen: "https://media.vogue.mx/photos/5e26328607b0840008ae2bfb/master/w_1600%2Cc_limit/rihanna-con-vestido-rojo.jpg",
      eras: [
        { 
            año: "2007", 
            titulo: "La Transformación", 
            descripcion: "Con 'Good Girl Gone Bad', Rihanna dejó atrás su imagen de estrella pop adolescente. Adoptó un sonido más oscuro, cortes de pelo asimétricos y dominó las pistas de baile con himnos indestructibles.", 
            img: "https://upload.wikimedia.org/wikipedia/en/f/f7/Good_Girl_Gone_Bad.png",
            stems: ["Umbrella", "Don't Stop The Music", "Disturbia"]
        },
        { 
            año: "2012", 
            titulo: "El Pop Imparable", 
            descripcion: "'Unapologetic' capturó el caos y la intensidad de su vida pública en ese momento. Una mezcla cruda de dubstep, EDM y baladas de R&B que demostró su versatilidad.", 
            img: "https://cdn-images.dzcdn.net/images/cover/07c1a0032b0333a38b65eebe65b1ef30/0x1900-000000-80-0-0.jpg",
            stems: ["Diamonds", "Pour It Up", "Jump", "No Love Allowed"] 
        },
        { 
            año: "2016", 
            titulo: "La Obra Maestra: ANTI", 
            descripcion: "El álbum que redefinió su carrera. 'ANTI' es un proyecto cohesivo, experimental y audaz donde Rihanna descarta las reglas de la radio para entregar su trabajo más íntimo y artísticamente libre.", 
            img: "https://upload.wikimedia.org/wikipedia/en/3/32/Rihanna_-_Anti.png",
            stems: ["Work", "Needed Me", "Kiss It Better", "Love on the Brain"]
        }
      ],
      ecos: [
        { id: "eminem", relacion: "Colisiones de Estadio", tipo: "Colaborador Frecuente" }
      ]
    },
    "dr-dre": {
      nombre: "Dr. Dre",
      subtitulo: "El Arquitecto del G-Funk",
      bio: "Pionero indiscutible del hip-hop de la Costa Oeste. Como productor y rapero, Dr. Dre esculpió el sonido del G-Funk, fundó imperios discográficos y descubrió a algunos de los talentos más grandes de la historia de la música.",
      imagen: "https://www.eminem.net/wp-content/uploads/dr-dre.png.webp",
      eras: [
        { 
            año: "1992", 
            titulo: "El Nacimiento del G-Funk", 
            descripcion: "Su debut en solitario, 'The Chronic', cambió la música para siempre. Sintetizadores lentos, bajos pesados de P-Funk y ritmos relajados que definieron el sonido de Los Ángeles en los 90.", 
            img: "https://upload.wikimedia.org/wikipedia/en/1/19/Dr.DreTheChronic.jpg",
            stems: ["Nuthin' but a 'G' Thang", "Let Me Ride", "Fuck wit Dre Day"]
        },
        { 
            año: "1999", 
            titulo: "El Regreso del Rey", 
            descripcion: "Con '2001', Dre actualizó su sonido para el nuevo milenio. Beats cinematográficos, pianos icónicos y una producción meticulosa que sigue siendo la referencia de oro para los ingenieros de sonido.", 
            img: "https://akamai.sscdn.co/letras/360x360/albuns/2/0/d/8/51821732195259.jpg",
            stems: ["Still D.R.E.", "The Next Episode", "Forgot About Dre"]
        },
        { 
            año: "2015", 
            titulo: "El Cierre Épico", 
            descripcion: "'Compton', la banda sonora inspirada en la película de N.W.A., fue su gran despedida. Un paisaje sonoro rico y complejo que sirvió como vitrina para la nueva generación de artistas de su ciudad.", 
            img: "https://upload.wikimedia.org/wikipedia/en/f/f4/DrDre-compton.jpg",
            stems: ["Talk About It", "It's All On Me", "Darkside/Gone", "Deep Water", "Animals"]
        }
      ],
      ecos: [
        { id: "eminem", relacion: "El Maestro y el Prodigio", tipo: "Descubridor y Productor" }
      ]
    },
    "the-weeknd": {
      nombre: "The Weeknd",
      subtitulo: "Cinematic Synth-Pop & Dark R&B",
      bio: "Abel Tesfaye comenzó como una figura enigmática en las sombras de internet y evolucionó hasta convertirse en el rey indiscutible del pop mundial. Su sonido es una mezcla embriagadora de R&B oscuro, nostalgia ochentera y narrativas cinematográficas de excesos y desamor.",
      imagen: "https://hips.hearstapps.com/hmg-prod/images/in-this-image-released-on-february-7th-the-weeknd-rehearses-news-photo-1641821562.jpg?resize=980:*",
      eras: [
        { 
            año: "2011", 
            titulo: "El Misterio de los Globos", 
            descripcion: "Con mixtapes como 'House of Balloons', introdujo un R&B denso, narcótico y misterioso que cambió el panorama del género, cantando sobre fiestas interminables y vacíos emocionales en las frías noches de Toronto.", 
            img: "https://udiscovermusic.co/cdn/shop/products/602547481917_THE_WEEKND_HOUSE_OF_BALLOONS_CD_A.png?v=1629731040&width=1000",
            stems: ["High For This", "The Morning", "Wicked Games", "Loft Music", "The Knowing"]
        },
        { 
            año: "2015", 
            titulo: "La Explosión Mainstream", 
            descripcion: "En 'Beauty Behind the Madness', su sonido alternativo chocó de frente con el pop masivo. Canciones como 'The Hills' probaron que la oscuridad profunda y el éxito global podían coexistir perfectamente.", 
            img: "https://upload.wikimedia.org/wikipedia/en/b/bd/The_Weeknd_-_Beauty_Behind_the_Madness.png",
            stems: ["The Hills", "Can't Feel My Face", "Earned It"]
        },
        { 
            año: "2016", 
            titulo: "El Chico Estrella", 
            descripcion: "Con 'Starboy', adopta una estética de neón, lujo y velocidad. Colaboraciones legendarias como la de Daft Punk consolidaron su estatus de superestrella con un pop más electrónico e implacable.", 
            img: "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png",
            stems: ["Starboy", "I Feel It Coming", "Party Monster"]
        },
        { 
            año: "2020", 
            titulo: "La Noche Sin Fin", 
            descripcion: "El pico de su carrera: 'After Hours'. Una obra conceptual y visualmente impecable, bañada en sangre y sintetizadores de los 80s, dominando el mundo entero con la energía inagotable de 'Blinding Lights'.", 
            img: "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_After_Hours.png",
            stems: ["Blinding Lights", "Save Your Tears", "In Your Eyes", "Heartless"]
        }
      ],
      ecos: [
        { id: "lana-del-rey", relacion: "Starboy & Stargirl", tipo: "Almas Gemelas Musicales" }
      ]
    },
    "lady-gaga": {
      nombre: "Lady Gaga",
      subtitulo: "Mother Monster & Pop Icon",
      bio: "Una fuerza imparable de la naturaleza. Lady Gaga redefinió la cultura pop en el siglo XXI con su teatralidad, su destreza vocal innegable y su capacidad camaleónica para saltar del dance-pop a flor de piel, al jazz y al rock de estadio.",
      imagen: "https://media.glamour.mx/photos/697ffd1f1948257fe83a0c16/16:9/w_1958,h_1101,c_limit/Grammys%202026%20Lady%20Gaga%20(1).jpg",
      eras: [
        {
            año: "2009",
            titulo: "El Monstruo de la Fama",
            descripcion: "Con 'The Fame Monster', Gaga oscureció su pop brillante, entregando himnos macabros y videos musicales legendarios que la coronaron como la reina indiscutible de la extravagancia.",
            img: "https://akamai.sscdn.co/uploadfile/letras/albuns/0/e/7/f/1726571680092986.jpg",
            stems: ["Bad Romance", "Alejandro", "Telephone"]
        },
        {
            año: "2011",
            titulo: "El Himno de una Generación",
            descripcion: "'Born This Way' llevó su sonido al límite, mezclando techno, heavy metal y ópera en un manifiesto de liberación y autoaceptación que resonó en todo el planeta.",
            img: "https://www.lamusica.com.co/cdn/shop/products/R-2915929-1313843739_jpeg_73f24289-3578-4464-b7e8-c018ba6e8773.jpg?v=1590758482",
            stems: ["Born This Way", "Judas", "The Edge of Glory"]
        },
        {
            año: "2020",
            titulo: "El Regreso a la Pista de Baile",
            descripcion: "'Chromatica' marcó su triunfal regreso al house y al dance-pop puro. Un universo conceptual de colores vibrantes diseñado para sanar a través del baile.",
            img: "https://i.scdn.co/image/ab67616d0000b2736040effba89b9b00a6f6743a",
            stems: ["Rain On Me", "Stupid Love", "911"]
        },
        {
            año: "2025",
            titulo: "El Caos y la Oscuridad",
            descripcion: "En 'Mayhem', Gaga nos sumerge en un pop oscuro y vanguardista. Un viaje gótico a través del caos que consolida su alianza con Bruno Mars en la poderosa balada 'Die With A Smile'.",
            img: "https://akamai.sscdn.co/uploadfile/letras/albuns/4/c/b/b/2815311741259410.jpg",
            stems: ["Disease", "Abracadabra", "Die With A Smile"]
        }
      ],
      ecos: [
        { id: "bruno-mars", relacion: "Voces de otra época", tipo: "Colaboración Histórica" }
      ]
    }
    }