import { Link } from 'react-router-dom';

export default function Artistas() {
    return (
        <main>
            <section className="catalog-section">
                <div className="section-header">
                    <h2>Salón de <span className="accent">Artistas</span></h2>
                </div>
                
                <div className="artist-grid">
                    {/* Michael Jackson */}
                    <Link to="/artistas/michael-jackson" className="artist-card">
                        <img src="https://cdn-images.dzcdn.net/images/artist/97fae13b2b30e4aec2e8c9e0c7839d92/1900x1900-000000-80-0-0.jpg" alt="Michael Jackson" />
                        <div className="artist-info">
                            <h3>Michael Jackson</h3>
                            <p>King of Pop</p>
                        </div>
                    </Link>
                    
                    {/* Bruno Mars */}
                    <Link to="/artistas/bruno-mars" className="artist-card">
                        <img src="https://akamai.sscdn.co/uploadfile/letras/fotos/4/2/d/3/42d3bb83236ac003c3315484f5ce8d7b.jpg" alt="Bruno Mars" />
                        <div className="artist-info">
                            <h3>Bruno Mars</h3>
                            <p>24K Funk</p>
                        </div>
                    </Link>

                    {/* Kendrick Lamar */}
                    <Link to="/artistas/kendrick-lamar" className="artist-card">
                        <img src="https://www.buseterim.com.tr/upload/default/2025/4/25/6802.jpg" alt="Kendrick Lamar" />
                        <div className="artist-info">
                            <h3>Kendrick Lamar</h3>
                            <p>Pulitzer Rap</p>
                        </div>
                    </Link>

                    {/* Billie Eilish */}
                    <Link to="/artistas/billie-eilish" className="artist-card">
                        <img src="https://istoedinheiro.com.br/wp-content/uploads/sites/17/Reuters_Direct_Media/BrazilOnlineReportEntertainmentNews/tagreuters.com2021binary_LYNXMPEH4A18L-BASEIMAGE.jpg" alt="Billie Eilish" />
                        <div className="artist-info">
                            <h3>Billie Eilish</h3>
                            <p>Dark Alt-Pop</p>
                        </div>
                    </Link>

                    {/* Lana Del Rey */}
                    <Link to="/artistas/lana-del-rey" className="artist-card">
                        <img src="https://bogartmagazine.com.mx/wp-content/uploads/2023/06/Lana-del-rey.png" alt="Billie Eilish" />
                        <div className="artist-info">
                            <h3>Lana Del Rey</h3>
                            <p>Art-Pop</p>
                        </div>
                    </Link>

                    {/* Eminem*/}
                    <Link to="/artistas/eminem" className="artist-card">
                    <img src="https://www.radiocontinentefm.cl/web/wp-content/uploads/2022/11/eminem.jpg" alt="Eminem" />
                    <div className="artist-info">
                        <h3>Eminem</h3>
                        <p>Rap God</p>
                    </div>
                    </Link>

                    {/* Rihanna */}
                    <Link to="/artistas/rihanna" className="artist-card">
                    <img src="https://industriamusical.com/wp-content/uploads/2023/07/Rihanna.jpg" alt="Rihanna" />
                    <div className="artist-info">
                        <h3>Rihanna</h3>
                        <p>Pop R&B</p>
                    </div>
                    </Link>
                    {/* Dr. Dre */}
                    <Link to="/artistas/dr-dre" className="artist-card">
                    <img src="https://ntvb.tmsimg.com/assets/assets/458_v9_bb.jpg" alt="Dr. Dre" />
                    <div className="artist-info">
                        <h3>Dr. Dre</h3>
                        <p>West Hip Hop</p>
                    </div>
                    </Link>
                    {/* The Weeknd */}
                    <Link to="/artistas/the-weeknd" className="artist-card">
                    <img src="https://indierocks.sfo3.digitaloceanspaces.com/wp-content/uploads/2021/11/The-Weeknd_2021.jpg" alt="The Weeknd" />
                    <div className="artist-info">
                        <h3>The Weeknd</h3>
                        <p>Shynt-Pop</p>
                    </div>
                    </Link>
                    {/* Lady Gaga */}
                    <Link to="/artistas/lady-gaga" className="artist-card">
                    <img src="https://www.hola.com/horizon/square/dbf2b510a5e9-lady-gaga-lanza-linea-maquillaje-haus-labs-t.jpg" alt="The Weeknd" />
                    <div className="artist-info">
                        <h3>Lady Gaga</h3>
                        <p>Monster Pop</p>
                    </div>
                    </Link>
                </div>
            </section>
        </main>
    );
}