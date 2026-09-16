"use client"
import React, { useState } from 'react'
import styles from './App.module.css'
import Image from 'next/image'

interface Station {
  name: string
  location: string
  status: 'online' | 'warning' | 'offline'
  temperature: number | null
  humidity: number | null
  sla: number
}

const stationsMock: Station[] = [
  { name: 'Estação 01', location: 'Talhão Norte', status: 'online', temperature: 22, humidity: 74, sla: 99.8 },
  { name: 'Estação 02', location: 'Divisa Leste', status: 'warning', temperature: 27, humidity: 58, sla: 96.4 },
  { name: 'Estação A - Parreirais', location: 'Setor Sul', status: 'online', temperature: 24, humidity: 80, sla: 99.9 },
  { name: 'Estação 03', location: 'Beira do Rio', status: 'offline', temperature: null, humidity: null, sla: 82.1 },
]

const statusLabel: Record<Station['status'], string> = {
  online: 'Online',
  warning: 'Alerta',
  offline: 'Offline',
}

const Page = () => {
  const [search, setSearch] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')

  const filteredStations = stationsMock.filter(station =>
    station.name.toLowerCase().includes(search.toLowerCase()) ||
    station.location.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateStation = () => {
    console.log('Criar estação:', { newName, newLocation })
    setIsNewModalOpen(false)
    setNewName('')
    setNewLocation('')
  }

  return (
    <div className={styles.containerGeral}>
      <div className={styles.content}>
        <h1 className={styles.title}>Estações de Monitoramento</h1>

        <div className={styles.containerFilters}>
          <div className={styles.searchWrapper}>
            <Image src="/images/lupa.png" alt="lupa" className={styles.searchIcon}  width={16} height={16}/>
            <input
              className={styles.filter}
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar estações..."
            />
          </div>
          <button className={styles.buttonNew} onClick={() => setIsNewModalOpen(true)}>
            Nova estação
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Estação</th>
              <th>Local</th>
              <th>Status</th>
              <th>Temperatura</th>
              <th>Umidade</th>
              <th>SLA</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map((station, index) => (
              <tr key={index}>
                <td>{station.name}</td>
                <td>{station.location}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`badge-${station.status}`]}`}>
                    {statusLabel[station.status]}
                  </span>
                </td>
                <td>{station.temperature !== null ? `${station.temperature}°C` : '—'}</td>
                <td>{station.humidity !== null ? `${station.humidity}%` : '—'}</td>
                <td>{station.sla}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStations.length === 0 && (
          <p className={styles.emptyState}>Nenhuma estação encontrada para {search}.</p>
        )}
      </div>

      {isNewModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Nova Estação</h2>

            <label>Nome</label>
            <input
              type='text'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Ex: Estação 05'
            />

            <label>Local</label>
            <input
              type='text'
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder='Ex: Talhão Norte'
            />

            <div className={styles.modalActions}>
              <button onClick={() => setIsNewModalOpen(false)}>Cancelar</button>
              <button onClick={handleCreateStation}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page